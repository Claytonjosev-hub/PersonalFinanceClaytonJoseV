import type {
  Category,
  Debt,
  MonthKey,
  PaymentMethod,
  RecurringExpense,
  RecurringIncome,
  Transaction,
} from './types';
import { monthKeyEquals, monthKeyFromDate } from './months';
import { installmentForMonth } from './debts';

export type CategoryTotal = { categoryId: string | null; categoryName: string; amount: number };
export type PaymentMethodBreakdown = {
  paymentMethodId: string | null;
  paymentMethodName: string;
  total: number;
  byCategory: CategoryTotal[];
};
export type MonthlyReceitas = { byCategory: CategoryTotal[]; total: number };
export type MonthlyDespesas = { byPaymentMethod: PaymentMethodBreakdown[]; total: number };

const RECURRING_INCOME_BUCKET = '__recurring__';
const NO_CATEGORY_BUCKET = '__sem_categoria__';
const NO_PAYMENT_METHOD_BUCKET = '__sem_forma_pagamento__';

export function computeMonthlyReceitas(
  month: MonthKey,
  recurringIncomes: RecurringIncome[],
  transactions: Transaction[],
  categories: Category[]
): MonthlyReceitas {
  const byCategory = new Map<string, number>();

  // Recurring incomes have no category in the schema — grouped under a
  // synthetic "Receitas padrão" bucket, kept separate from manual receita
  // categories so the two sources are never silently merged.
  const recurringTotal = recurringIncomes.reduce((sum, i) => sum + i.amount, 0);
  if (recurringTotal > 0) byCategory.set(RECURRING_INCOME_BUCKET, recurringTotal);

  for (const tx of transactions) {
    if (tx.type !== 'receita') continue;
    if (!monthKeyEquals(monthKeyFromDate(tx.date), month)) continue;
    const key = tx.category_id ?? NO_CATEGORY_BUCKET;
    byCategory.set(key, (byCategory.get(key) ?? 0) + tx.amount);
  }

  const rows: CategoryTotal[] = Array.from(byCategory.entries()).map(([id, amount]) => ({
    categoryId: id === RECURRING_INCOME_BUCKET || id === NO_CATEGORY_BUCKET ? null : id,
    categoryName:
      id === RECURRING_INCOME_BUCKET
        ? 'Receitas padrão'
        : id === NO_CATEGORY_BUCKET
          ? 'Sem categoria'
          : (categories.find((c) => c.id === id)?.name ?? 'Categoria removida'),
    amount,
  }));

  return { byCategory: rows, total: rows.reduce((sum, r) => sum + r.amount, 0) };
}

function categoryName(categories: Category[], id: string | null, fallback: string): string {
  if (!id) return fallback;
  return categories.find((c) => c.id === id)?.name ?? 'Categoria removida';
}

function paymentMethodName(paymentMethods: PaymentMethod[], id: string | null): string {
  if (!id) return 'Sem forma de pagamento';
  return paymentMethods.find((pm) => pm.id === id)?.name ?? 'Forma removida';
}

export function computeMonthlyDespesas(
  month: MonthKey,
  debts: Debt[],
  recurringExpenses: RecurringExpense[],
  transactions: Transaction[],
  paymentMethods: PaymentMethod[],
  categories: Category[]
): MonthlyDespesas {
  // paymentMethodId -> categoryKey -> amount
  const grouped = new Map<string, Map<string, { categoryId: string | null; label: string; amount: number }>>();

  function addTo(
    paymentMethodId: string | null,
    categoryId: string | null,
    label: string,
    amount: number
  ) {
    if (amount === 0) return;
    const pmKey = paymentMethodId ?? NO_PAYMENT_METHOD_BUCKET;
    const catKey = `${categoryId ?? NO_CATEGORY_BUCKET}__${label}`;
    if (!grouped.has(pmKey)) grouped.set(pmKey, new Map());
    const catMap = grouped.get(pmKey)!;
    const existing = catMap.get(catKey);
    if (existing) {
      existing.amount += amount;
    } else {
      catMap.set(catKey, { categoryId, label, amount });
    }
  }

  // Debt installments — labeled distinctly so it's visually obvious which
  // portion of a payment method's total is automatic (spec 03 §2).
  for (const debt of debts) {
    const amount = installmentForMonth(debt, month);
    if (amount === 0) continue;
    const baseLabel = categoryName(categories, debt.category_id, debt.description);
    addTo(debt.payment_method_id, debt.category_id, `${baseLabel} (dívidas)`, amount);
  }

  // Recurring (fixed) expenses.
  for (const expense of recurringExpenses) {
    const label = categoryName(categories, expense.category_id, expense.description);
    addTo(expense.payment_method_id, expense.category_id, label, expense.amount);
  }

  // Manual / imported despesa transactions.
  for (const tx of transactions) {
    if (tx.type !== 'despesa') continue;
    if (!monthKeyEquals(monthKeyFromDate(tx.date), month)) continue;
    const label = categoryName(categories, tx.category_id, 'Sem categoria');
    addTo(tx.payment_method_id, tx.category_id, label, tx.amount);
  }

  const byPaymentMethod: PaymentMethodBreakdown[] = Array.from(grouped.entries()).map(
    ([pmKey, catMap]) => {
      const byCategory = Array.from(catMap.values()).map((c) => ({
        categoryId: c.categoryId,
        categoryName: c.label,
        amount: c.amount,
      }));
      return {
        paymentMethodId: pmKey === NO_PAYMENT_METHOD_BUCKET ? null : pmKey,
        paymentMethodName: paymentMethodName(
          paymentMethods,
          pmKey === NO_PAYMENT_METHOD_BUCKET ? null : pmKey
        ),
        total: byCategory.reduce((sum, c) => sum + c.amount, 0),
        byCategory,
      };
    }
  );

  return {
    byPaymentMethod,
    total: byPaymentMethod.reduce((sum, pm) => sum + pm.total, 0),
  };
}

export function computeSaldoAcumulado(
  initialBalance: number,
  monthlyResultados: number[] // same length/order as the months axis
): number[] {
  let running = initialBalance;
  return monthlyResultados.map((resultado) => {
    running += resultado;
    return running;
  });
}

export type Indicadores = {
  percentRendaComprometida: number; // debt installments / total receitas
  percentRendaGasta: number; // total despesas / total receitas
  status: 'deficit' | 'ok';
};

export function computeIndicadores(
  totalReceitas: number,
  totalDespesas: number,
  totalParcelasDividas: number
): Indicadores {
  const safe = (n: number, d: number) => (d === 0 ? 0 : n / d);
  return {
    percentRendaComprometida: safe(totalParcelasDividas, totalReceitas),
    percentRendaGasta: safe(totalDespesas, totalReceitas),
    status: totalReceitas - totalDespesas < 0 ? 'deficit' : 'ok',
  };
}

export function totalDebtInstallmentsForMonth(debts: Debt[], month: MonthKey): number {
  return debts.reduce((sum, debt) => sum + installmentForMonth(debt, month), 0);
}
