import type { Debt, MonthKey } from './types';
import { addMonths, monthKeyFromDate, monthsBetween } from './months';

export type DebtSchedule = {
  lastInstallmentMonth: MonthKey | 'recorrente';
  totalValue: number | null;
  remainingInstallments: number;
  outstandingBalance: number;
  status: 'ativa' | 'quitada' | 'recorrente';
};

/**
 * The installment amount due for `debt` in `month`, or 0 if none is due.
 * This is the single cell of the Dívidas cronograma grid, and is what the
 * Plan 3 projection reuses for auto_debt rows.
 */
export function installmentForMonth(debt: Debt, month: MonthKey): number {
  if (debt.manually_closed_at) return 0;

  const firstMonth = monthKeyFromDate(debt.first_installment_date);
  const offset = monthsBetween(firstMonth, month);
  if (offset < 0) return 0;

  if (debt.is_recurring) return debt.installment_amount;

  if (debt.total_installments != null && offset < debt.total_installments) {
    return debt.installment_amount;
  }
  return 0;
}

export function computeDebtSchedule(
  debt: Debt,
  monthsAxis: MonthKey[],
  currentMonth: MonthKey
): DebtSchedule {
  if (debt.manually_closed_at) {
    return {
      lastInstallmentMonth: debt.is_recurring
        ? 'recorrente'
        : monthKeyFromDate(debt.first_installment_date),
      totalValue: debt.is_recurring
        ? null
        : (debt.total_installments ?? 0) * debt.installment_amount,
      remainingInstallments: 0,
      outstandingBalance: 0,
      status: 'quitada',
    };
  }

  if (debt.is_recurring) {
    return {
      lastInstallmentMonth: 'recorrente',
      totalValue: null,
      remainingInstallments: monthsAxis.filter((m) => installmentForMonth(debt, m) > 0).length,
      outstandingBalance: monthsAxis.reduce((sum, m) => sum + installmentForMonth(debt, m), 0),
      status: 'recorrente',
    };
  }

  const firstMonth = monthKeyFromDate(debt.first_installment_date);
  const totalInstallments = debt.total_installments ?? 0;
  const lastInstallmentMonth = addMonths(firstMonth, totalInstallments - 1);
  const remainingInstallments = Math.max(
    0,
    totalInstallments - Math.max(0, monthsBetween(firstMonth, currentMonth))
  );

  return {
    lastInstallmentMonth,
    totalValue: totalInstallments * debt.installment_amount,
    remainingInstallments,
    outstandingBalance: remainingInstallments * debt.installment_amount,
    status: remainingInstallments > 0 ? 'ativa' : 'quitada',
  };
}

export function totalMonthlyByPaymentMethod(
  debts: Debt[],
  month: MonthKey
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const debt of debts) {
    const amount = installmentForMonth(debt, month);
    if (amount === 0) continue;
    const key = debt.payment_method_id ?? 'sem_forma_pagamento';
    totals[key] = (totals[key] ?? 0) + amount;
  }
  return totals;
}

export function totalCommittedByPaymentMethod(
  debts: Debt[],
  monthsAxis: MonthKey[],
  currentMonth: MonthKey
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const debt of debts) {
    const schedule = computeDebtSchedule(debt, monthsAxis, currentMonth);
    const key = debt.payment_method_id ?? 'sem_forma_pagamento';
    totals[key] = (totals[key] ?? 0) + schedule.outstandingBalance;
  }
  return totals;
}
