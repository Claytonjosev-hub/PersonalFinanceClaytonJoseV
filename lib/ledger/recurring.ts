import type { RecurringIncome, RecurringExpense } from './types';

export function sumRecurringIncomes(incomes: RecurringIncome[]): number {
  return incomes.reduce((total, income) => total + income.amount, 0);
}

export function sumRecurringExpenses(expenses: RecurringExpense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}
