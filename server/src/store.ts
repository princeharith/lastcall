import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(__dirname, '../data/config.json');

export interface ServerExpense {
  id: string;
  amount: number;
  merchant: string;
  timestamp: string; // ISO
}

export interface Store {
  contactPhone?: string;
  expoPushToken?: string;
  budget?: number;
  periodStart?: string;  // 'YYYY-MM'
  totalSpent?: number;
  firedThresholds?: number[];
  expenses?: ServerExpense[];
}

const THRESHOLDS = [0.5, 0.75, 0.9, 1.0, 1.25];

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function ensureDir() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load(): Store {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function save(data: Store) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

let _store: Store = load();

export function getConfig(): Store {
  return _store;
}

export function setConfig(patch: Partial<Store>) {
  _store = { ..._store, ...patch };
  save(_store);
}

/**
 * Adds an expense to the running total.
 * Resets the period if the month has changed.
 * Returns which thresholds were newly crossed.
 */
export function getExpensesSince(since: string): ServerExpense[] {
  const sinceTime = new Date(since).getTime();
  return (_store.expenses ?? []).filter(
    (e) => new Date(e.timestamp).getTime() > sinceTime,
  );
}

export function recordExpense(amount: number, merchant: string): number[] {
  const period = currentPeriod();

  // New month — reset
  if (_store.periodStart !== period) {
    _store.periodStart = period;
    _store.totalSpent = 0;
    _store.firedThresholds = [];
    _store.expenses = [];
  }

  const expense: ServerExpense = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    amount,
    merchant,
    timestamp: new Date().toISOString(),
  };

  _store.expenses = [expense, ...(_store.expenses ?? [])];
  _store.totalSpent = (_store.totalSpent ?? 0) + amount;

  const budget = _store.budget ?? 0;
  const newThresholds: number[] = [];

  if (budget > 0) {
    const ratio = _store.totalSpent / budget;
    const alreadyFired = _store.firedThresholds ?? [];

    for (const t of THRESHOLDS) {
      if (ratio >= t && !alreadyFired.includes(t)) {
        alreadyFired.push(t);
        newThresholds.push(t);
      }
    }

    _store.firedThresholds = alreadyFired;
  }

  save(_store);
  return newThresholds;
}

/** Adds an expense from the app (no threshold checking, no SMS). */
export function addAppExpense(id: string, amount: number, merchant: string, timestamp: string): void {
  const period = currentPeriod();
  if (_store.periodStart !== period) {
    _store.periodStart = period;
    _store.totalSpent = 0;
    _store.firedThresholds = [];
    _store.expenses = [];
  }
  const expense: ServerExpense = { id, amount, merchant, timestamp };
  _store.expenses = [expense, ...(_store.expenses ?? [])];
  _store.totalSpent = (_store.totalSpent ?? 0) + amount;
  save(_store);
}

/** Deletes an expense by id and recalculates totalSpent. */
export function deleteExpenseById(id: string): boolean {
  const before = (_store.expenses ?? []).length;
  _store.expenses = (_store.expenses ?? []).filter((e) => e.id !== id);
  if (_store.expenses.length === before) return false;
  _store.totalSpent = _store.expenses.reduce((sum, e) => sum + e.amount, 0);
  save(_store);
  return true;
}

export function getAllExpenses(): ServerExpense[] {
  return _store.expenses ?? [];
}

export function thresholdMessage(threshold: number, spent: number, budget: number): string {
  const pct = Math.round(threshold * 100);
  const over = (spent - budget).toFixed(2);
  switch (threshold) {
    case 0.50: return `Heads up - 50% of your budget is gone (${spent.toFixed(2)} of ${budget})`;
    case 0.75: return `Warning - 75% of budget used (${spent.toFixed(2)} of ${budget}). Slow down!`;
    case 0.90: return `Alert - 90% of budget used (${spent.toFixed(2)} of ${budget}). Almost out!`;
    case 1.00: return `Budget blown! Spent ${spent.toFixed(2)} of ${budget}.`;
    case 1.25: return `25% over budget (${over} over). Send help.`;
    default:   return `${pct}% of budget reached (${spent.toFixed(2)} of ${budget})`;
  }
}