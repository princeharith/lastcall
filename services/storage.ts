import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  Expense,
  BudgetSettings,
  TrustedContact,
  AlertLevel,
} from '../types';

const KEYS = {
  EXPENSES: 'lc_expenses',
  BUDGET_SETTINGS: 'lc_budget_settings',
  TRUSTED_CONTACT: 'lc_trusted_contact',
  LAST_ALERT_LEVEL: 'lc_last_alert_level',
  SIMULATE_MODE: 'lc_simulate_mode',
  TEXTBELT_KEY: 'textbelt_api_key',
  SERVER_URL: 'lc_server_url',
} as const;

// ── Expenses ──────────────────────────────────────────────────────────────────

export async function loadExpenses(): Promise<Expense[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.EXPENSES);
    return raw ? (JSON.parse(raw) as Expense[]) : [];
  } catch {
    return [];
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
}

export async function appendExpense(expense: Expense): Promise<Expense[]> {
  const existing = await loadExpenses();
  const updated = [expense, ...existing];
  await saveExpenses(updated);
  return updated;
}

export async function deleteExpense(id: string): Promise<Expense[]> {
  const existing = await loadExpenses();
  const updated = existing.filter((e) => e.id !== id);
  await saveExpenses(updated);
  return updated;
}

// ── Budget Settings ───────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: BudgetSettings = {
  monthlyBudget: 500,
  warningThreshold: 0.75,
  criticalThreshold: 0.9,
};

export async function loadBudgetSettings(): Promise<BudgetSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BUDGET_SETTINGS);
    return raw ? (JSON.parse(raw) as BudgetSettings) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveBudgetSettings(settings: BudgetSettings): Promise<void> {
  await AsyncStorage.setItem(KEYS.BUDGET_SETTINGS, JSON.stringify(settings));
}

// ── Trusted Contact ───────────────────────────────────────────────────────────

export async function loadTrustedContact(): Promise<TrustedContact | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRUSTED_CONTACT);
    return raw ? (JSON.parse(raw) as TrustedContact) : null;
  } catch {
    return null;
  }
}

export async function saveTrustedContact(contact: TrustedContact): Promise<void> {
  await AsyncStorage.setItem(KEYS.TRUSTED_CONTACT, JSON.stringify(contact));
}

// ── Alert Level Tracking ──────────────────────────────────────────────────────

export async function loadLastAlertLevel(): Promise<AlertLevel> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LAST_ALERT_LEVEL);
    return (raw as AlertLevel) ?? 'none';
  } catch {
    return 'none';
  }
}

export async function saveLastAlertLevel(level: AlertLevel): Promise<void> {
  await AsyncStorage.setItem(KEYS.LAST_ALERT_LEVEL, level);
}

// ── Textbelt API Key (SecureStore) ────────────────────────────────────────────

export async function saveTextbeltKey(apiKey: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.TEXTBELT_KEY, apiKey);
}

export async function loadTextbeltKey(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(KEYS.TEXTBELT_KEY);
  } catch {
    return null;
  }
}

export async function clearTextbeltKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.TEXTBELT_KEY);
}

// ── Simulate Mode ─────────────────────────────────────────────────────────────

export async function loadSimulateMode(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SIMULATE_MODE);
    return raw === 'true';
  } catch {
    return false;
  }
}

export async function saveSimulateMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.SIMULATE_MODE, String(enabled));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// ── Server URL ────────────────────────────────────────────────────────────────

export async function loadServerUrl(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(KEYS.SERVER_URL)) ?? '';
  } catch {
    return '';
  }
}

export async function saveServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.SERVER_URL, url);
}

/** Returns total spent for the current calendar month */
export function sumCurrentMonth(expenses: Expense[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return expenses
    .filter((e) => e.timestamp >= monthStart)
    .reduce((acc, e) => acc + e.amount, 0);
}
