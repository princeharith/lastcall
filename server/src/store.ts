import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(__dirname, '../data/config.json');

export interface Store {
  contactPhone?: string;
  expoPushToken?: string;
  budget?: number;
  // Running total — resets when periodStart changes to a new month
  periodStart?: string;  // 'YYYY-MM' e.g. '2026-03'
  totalSpent?: number;
  firedThresholds?: number[]; // e.g. [0.5, 0.75]
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
export function recordExpense(amount: number): number[] {
  const period = currentPeriod();

  // New month — reset
  if (_store.periodStart !== period) {
    _store.periodStart = period;
    _store.totalSpent = 0;
    _store.firedThresholds = [];
  }

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

export function thresholdMessage(threshold: number, spent: number, budget: number): string {
  const pct = Math.round(threshold * 100);
  const over = (spent - budget).toFixed(2);
  switch (threshold) {
    case 0.50: return `👀 Heads up — 50% of the budget is gone ($${spent.toFixed(2)} / $${budget})`;
    case 0.75: return `⚠️ 75% of budget used ($${spent.toFixed(2)} / $${budget}). Slow down?`;
    case 0.90: return `🚨 90% of budget used ($${spent.toFixed(2)} / $${budget}). Almost out!`;
    case 1.00: return `🔴 Budget blown! Spent $${spent.toFixed(2)} of $${budget}.`;
    case 1.25: return `💀 25% over budget ($${over} over). Send help.`;
    default:   return `${pct}% of budget reached ($${spent.toFixed(2)} / $${budget})`;
  }
}