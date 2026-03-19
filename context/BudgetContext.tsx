import React, { createContext, useContext } from 'react';
import { useBudget } from '../hooks/useBudget';

type BudgetContextValue = ReturnType<typeof useBudget>;

const BudgetContext = createContext<BudgetContextValue | null>(null);

export function BudgetProvider({ children }: { children: React.ReactNode }) {
  const budget = useBudget();
  return <BudgetContext.Provider value={budget}>{children}</BudgetContext.Provider>;
}

export function useBudgetContext(): BudgetContextValue {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudgetContext must be used inside BudgetProvider');
  return ctx;
}
