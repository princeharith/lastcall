export interface Expense {
  id: string;
  amount: number;
  category: ExpenseCategory;
  note: string;
  timestamp: number; // Unix ms
}

export type ExpenseCategory =
  | 'food'
  | 'drinks'
  | 'transport'
  | 'shopping'
  | 'entertainment'
  | 'bills'
  | 'other';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food: 'Food',
  drinks: 'Drinks',
  transport: 'Transport',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  bills: 'Bills',
  other: 'Other',
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: 'fast-food',
  drinks: 'wine',
  transport: 'car',
  shopping: 'bag-handle',
  entertainment: 'musical-notes',
  bills: 'receipt',
  other: 'ellipsis-horizontal',
};

export interface BudgetSettings {
  monthlyBudget: number;
  warningThreshold: number;  // 0–1 fraction (e.g. 0.75 = 75%)
  criticalThreshold: number; // 0–1 fraction (e.g. 0.90 = 90%)
}

export interface TrustedContact {
  name: string;
  phone: string; // E.164 format e.g. +15551234567
}

export interface TextbeltConfig {
  apiKey: string;
}

export type AlertLevel = 'none' | 'warning' | 'critical' | 'over';

export interface BudgetState {
  expenses: Expense[];
  settings: BudgetSettings;
  trustedContact: TrustedContact | null;
  lastAlertLevel: AlertLevel;
}
