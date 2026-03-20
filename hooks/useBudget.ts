import { useState, useEffect, useCallback, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import {
  Expense,
  BudgetSettings,
  TrustedContact,
  AlertLevel,
} from '../types';
import {
  loadExpenses,
  loadBudgetSettings,
  loadTrustedContact,
  loadLastAlertLevel,
  appendExpense,
  deleteExpense,
  saveBudgetSettings,
  saveTrustedContact,
  saveLastAlertLevel,
  saveSimulateMode,
  loadSimulateMode,
  sumCurrentMonth,
  loadTextbeltKey,
  loadServerUrl,
  saveExpenses,
} from '../services/storage';
import { sendSMS, simulateSMS, buildAlertMessage } from '../services/smsService';
import { scheduleLocalBudgetAlert } from '../services/notificationService';

function computeAlertLevel(spent: number, settings: BudgetSettings): AlertLevel {
  const ratio = spent / settings.monthlyBudget;
  if (ratio >= 1) return 'over';
  if (ratio >= settings.criticalThreshold) return 'critical';
  if (ratio >= settings.warningThreshold) return 'warning';
  return 'none';
}

/** Alert escalation order so we only fire once per level */
const LEVEL_ORDER: AlertLevel[] = ['none', 'warning', 'critical', 'over'];

function isEscalation(prev: AlertLevel, next: AlertLevel): boolean {
  return LEVEL_ORDER.indexOf(next) > LEVEL_ORDER.indexOf(prev);
}

export function useBudget() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<BudgetSettings>({
    monthlyBudget: 500,
    warningThreshold: 0.75,
    criticalThreshold: 0.9,
  });
  const [trustedContact, setTrustedContact] = useState<TrustedContact | null>(null);
  const [lastAlertLevel, setLastAlertLevel] = useState<AlertLevel>('none');
  const [simulateMode, setSimulateModeState] = useState(false);
  const [lastSmsQuota, setLastSmsQuota] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Use ref so the alert side-effect sees latest state without stale closure
  const alertLevelRef = useRef<AlertLevel>('none');
  const simulateModeRef = useRef(false);

  useEffect(() => {
    (async () => {
      const [exps, sets, contact, level, simulate] = await Promise.all([
        loadExpenses(),
        loadBudgetSettings(),
        loadTrustedContact(),
        loadLastAlertLevel(),
        loadSimulateMode(),
      ]);
      setExpenses(exps);
      setSettings(sets);
      setTrustedContact(contact);
      setLastAlertLevel(level);
      alertLevelRef.current = level;
      setSimulateModeState(simulate);
      simulateModeRef.current = simulate;
      setIsLoaded(true);
    })();
  }, []);

  const spent = sumCurrentMonth(expenses);
  const alertLevel = computeAlertLevel(spent, settings);
  const percentUsed = Math.min(spent / settings.monthlyBudget, 1);

  /** Fire SMS + local notification when alert level escalates */
  const checkAndFireAlerts = useCallback(
    async (newSpent: number, currentSettings: BudgetSettings) => {
      const newLevel = computeAlertLevel(newSpent, currentSettings);
      const prevLevel = alertLevelRef.current;

      if (isEscalation(prevLevel, newLevel)) {
        alertLevelRef.current = newLevel;
        setLastAlertLevel(newLevel);
        await saveLastAlertLevel(newLevel);

        // Local push notification
        await scheduleLocalBudgetAlert({
          alertLevel: newLevel,
          spent: newSpent,
          budget: currentSettings.monthlyBudget,
        });

        // SMS via Textbelt (or simulate)
        const contact = await loadTrustedContact();
        if (contact) {
          const message = buildAlertMessage(newLevel, newSpent, currentSettings.monthlyBudget);
          try {
            if (simulateModeRef.current) {
              await simulateSMS(contact.phone, message);
            } else {
              const apiKey = await loadTextbeltKey();
              if (apiKey) {
                const result = await sendSMS(apiKey, contact.phone, message);
                if (result.quotaRemaining !== undefined) {
                  setLastSmsQuota(result.quotaRemaining);
                }
              }
            }
          } catch (err) {
            console.error('SMS send failed:', err);
          }
        }
      }
    },
    [],
  );

  // Poll server every 30s — replace local expenses with server's full list
  useEffect(() => {
    if (!isLoaded) return;

    const poll = async () => {
      const serverUrl = await loadServerUrl();
      if (!serverUrl.trim()) return;
      try {
        const res = await fetch(`${serverUrl.trim()}/api/budget`);
        if (!res.ok) return;
        const data = await res.json() as {
          expenses: { id: string; amount: number; merchant: string; timestamp: string }[];
        };
        const serverExpenses: Expense[] = data.expenses.map((e) => ({
          id: e.id,
          amount: e.amount,
          category: 'other' as const,
          note: e.merchant,
          timestamp: new Date(e.timestamp).getTime(),
        }));
        await saveExpenses(serverExpenses);
        setExpenses(serverExpenses);
      } catch {
        // silently ignore network errors
      }
    };

    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [isLoaded]);

  const addExpense = useCallback(
    async (expense: Omit<Expense, 'id' | 'timestamp'>) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newExpense: Expense = {
        ...expense,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now(),
      };

      const updated = await appendExpense(newExpense);
      setExpenses(updated);

      // Sync to server (no SMS — server only alerts on Shortcut transactions)
      const serverUrl = await loadServerUrl();
      if (serverUrl.trim()) {
        fetch(`${serverUrl.trim()}/api/expense`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newExpense.id,
            amount: newExpense.amount,
            merchant: newExpense.note || expense.category,
            timestamp: new Date(newExpense.timestamp).toISOString(),
          }),
        }).catch(() => {});
      }

      const newSpent = sumCurrentMonth(updated);
      await checkAndFireAlerts(newSpent, settings);
    },
    [settings, checkAndFireAlerts],
  );

  const removeExpense = useCallback(async (id: string) => {
    const updated = await deleteExpense(id);
    setExpenses(updated);

    // Sync delete to server
    const serverUrl = await loadServerUrl();
    if (serverUrl.trim()) {
      fetch(`${serverUrl.trim()}/api/expense/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  }, []);

  const updateSettings = useCallback(
    async (newSettings: BudgetSettings) => {
      setSettings(newSettings);
      await saveBudgetSettings(newSettings);
      // Re-check alerts with new thresholds
      await checkAndFireAlerts(sumCurrentMonth(expenses), newSettings);
    },
    [expenses, checkAndFireAlerts],
  );

  const updateTrustedContact = useCallback(async (contact: TrustedContact) => {
    setTrustedContact(contact);
    await saveTrustedContact(contact);
  }, []);

  /** Reset alert level (e.g. on new month) */
  const resetAlertLevel = useCallback(async () => {
    alertLevelRef.current = 'none';
    setLastAlertLevel('none');
    await saveLastAlertLevel('none');
  }, []);

  const updateSimulateMode = useCallback(async (enabled: boolean) => {
    simulateModeRef.current = enabled;
    setSimulateModeState(enabled);
    await saveSimulateMode(enabled);
  }, []);

  return {
    expenses,
    settings,
    trustedContact,
    lastAlertLevel,
    alertLevel,
    simulateMode,
    lastSmsQuota,
    spent,
    percentUsed,
    isLoaded,
    addExpense,
    removeExpense,
    updateSettings,
    updateTrustedContact,
    updateSimulateMode,
    resetAlertLevel,
  };
}
