import type {
  Category,
  Debt,
  MonthKey,
  PaymentMethod,
  RecurringExpense,
  RecurringIncome,
  Transaction,
} from './types';
import { addMonths, monthKeyEquals, monthKeyFromDate } from './months';
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

// --- Daily projection (Fluxo de Caixa) ---

export type DailyEntry = {
  day: number;
  receitasAutomaticas: number;
  receitasManuais: number;
  despesasAutomaticas: number;
  despesasManuais: number;
  saldo: number;
};

function daysInMonth(month: MonthKey): number {
  return new Date(month.year, month.month, 0).getDate();
}

// Clamps a configured due_day to the last real day of the month (e.g. 31 in
// February lands on the 28th/29th, never overflows into March), and falls
// back to day 1 when no due_day is configured.
export function dueDayInMonth(dueDay: number | null, month: MonthKey): number {
  if (dueDay == null) return 1;
  return Math.min(dueDay, daysInMonth(month));
}

export function computeDailyEntriesForMonth(
  month: MonthKey,
  parameters: { salary_day: number; initial_balance: number },
  recurringIncomes: RecurringIncome[],
  recurringExpenses: RecurringExpense[],
  debts: Debt[],
  paymentMethods: PaymentMethod[],
  transactions: Transaction[],
  saldoInicioDoMes: number
): DailyEntry[] {
  const total = daysInMonth(month);
  const recurringIncomeTotal = recurringIncomes.reduce((sum, i) => sum + i.amount, 0);

  // Automatic expense amount due on each day, aggregated across every
  // payment method (debt installments + recurring expenses tied to it) plus
  // recurring expenses with no payment method (placed by their own due_day).
  const despesaAutomaticaPorDia = new Map<number, number>();

  for (const pm of paymentMethods) {
    const debtTotal = debts.reduce(
      (sum, debt) => (debt.payment_method_id === pm.id ? sum + installmentForMonth(debt, month) : sum),
      0
    );
    const recurringTotal = recurringExpenses.reduce(
      (sum, exp) => (exp.payment_method_id === pm.id ? sum + exp.amount : sum),
      0
    );
    const amount = debtTotal + recurringTotal;
    if (amount === 0) continue;
    const day = dueDayInMonth(pm.due_day, month);
    despesaAutomaticaPorDia.set(day, (despesaAutomaticaPorDia.get(day) ?? 0) + amount);
  }

  // Debts and recurring expenses with no payment method fall back to their
  // own due_day (debts have none — placed on day 1) / recurring_expenses.due_day.
  const semFormaPagamentoDebts = debts.reduce(
    (sum, debt) => (debt.payment_method_id == null ? sum + installmentForMonth(debt, month) : sum),
    0
  );
  if (semFormaPagamentoDebts > 0) {
    despesaAutomaticaPorDia.set(1, (despesaAutomaticaPorDia.get(1) ?? 0) + semFormaPagamentoDebts);
  }
  for (const exp of recurringExpenses) {
    if (exp.payment_method_id != null) continue;
    const day = dueDayInMonth(exp.due_day, month);
    despesaAutomaticaPorDia.set(day, (despesaAutomaticaPorDia.get(day) ?? 0) + exp.amount);
  }

  let saldo = saldoInicioDoMes;
  const entries: DailyEntry[] = [];

  for (let day = 1; day <= total; day++) {
    const receitasAutomaticas = day === parameters.salary_day ? recurringIncomeTotal : 0;

    let receitasManuais = 0;
    let despesasManuais = 0;
    for (const tx of transactions) {
      const txDate = monthKeyFromDate(tx.date);
      if (!monthKeyEquals(txDate, month)) continue;
      if (Number(tx.date.slice(8, 10)) !== day) continue;
      if (tx.type === 'receita') receitasManuais += tx.amount;
      else despesasManuais += tx.amount;
    }

    const despesasAutomaticas = despesaAutomaticaPorDia.get(day) ?? 0;

    saldo = saldo + receitasAutomaticas + receitasManuais - despesasAutomaticas - despesasManuais;

    entries.push({
      day,
      receitasAutomaticas,
      receitasManuais,
      despesasAutomaticas,
      despesasManuais,
      saldo,
    });
  }

  return entries;
}

// --- Upcoming events (Home dashboard) ---

export type UpcomingItem = {
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number;
};

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function daysBetweenIso(fromIso: string, toIso: string): number {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000);
}

function withinHorizon(todayIso: string, dateIso: string, horizonDays: number): boolean {
  const delta = daysBetweenIso(todayIso, dateIso);
  return delta >= 0 && delta <= horizonDays;
}

// Looks 3 months ahead — enough headroom for any 30-day horizon starting on
// any day of any month, including a late-month start that spills over an
// extra month boundary (e.g. Jan 31 + 30 days lands in March).
const UPCOMING_MONTHS_AHEAD = 3;

export function computeUpcomingReceitas(
  todayIso: string,
  horizonDays: number,
  parameters: { salary_day: number },
  recurringIncomes: RecurringIncome[],
  transactions: Transaction[]
): UpcomingItem[] {
  const items: UpcomingItem[] = [];
  const recurringTotal = recurringIncomes.reduce((sum, i) => sum + i.amount, 0);

  if (recurringTotal > 0) {
    let month = monthKeyFromDate(todayIso);
    for (let i = 0; i < UPCOMING_MONTHS_AHEAD; i++) {
      // Mirrors computeDailyEntriesForMonth: an unclamped salary_day simply
      // has no occurrence in a shorter month (e.g. day 31 in February).
      if (parameters.salary_day <= daysInMonth(month)) {
        const candidate = isoDate(month.year, month.month, parameters.salary_day);
        if (withinHorizon(todayIso, candidate, horizonDays)) {
          items.push({ date: candidate, description: 'Salário (recorrente)', amount: recurringTotal });
        }
      }
      month = addMonths(month, 1);
    }
  }

  for (const tx of transactions) {
    if (tx.type !== 'receita') continue;
    if (!withinHorizon(todayIso, tx.date, horizonDays)) continue;
    items.push({ date: tx.date, description: tx.notes || 'Lançamento manual', amount: tx.amount });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}

export function computeUpcomingDespesas(
  todayIso: string,
  horizonDays: number,
  debts: Debt[],
  recurringExpenses: RecurringExpense[],
  paymentMethods: PaymentMethod[],
  transactions: Transaction[]
): UpcomingItem[] {
  const items: UpcomingItem[] = [];

  // Same placement rule as computeDailyEntriesForMonth: a debt/expense tied
  // to a payment method is due on that payment method's due_day, not its
  // own; one with no payment method falls back to its own due_day (or day 1).
  function dueDay(paymentMethodId: string | null, ownDueDay: number | null, month: MonthKey): number {
    if (paymentMethodId) {
      const pm = paymentMethods.find((p) => p.id === paymentMethodId);
      return dueDayInMonth(pm?.due_day ?? null, month);
    }
    return dueDayInMonth(ownDueDay, month);
  }

  let month = monthKeyFromDate(todayIso);
  for (let i = 0; i < UPCOMING_MONTHS_AHEAD; i++) {
    for (const debt of debts) {
      const amount = installmentForMonth(debt, month);
      if (amount === 0) continue;
      const candidate = isoDate(month.year, month.month, dueDay(debt.payment_method_id, null, month));
      if (withinHorizon(todayIso, candidate, horizonDays)) {
        items.push({ date: candidate, description: debt.description, amount });
      }
    }
    for (const exp of recurringExpenses) {
      const candidate = isoDate(
        month.year,
        month.month,
        dueDay(exp.payment_method_id, exp.due_day, month)
      );
      if (withinHorizon(todayIso, candidate, horizonDays)) {
        items.push({ date: candidate, description: exp.description, amount: exp.amount });
      }
    }
    month = addMonths(month, 1);
  }

  for (const tx of transactions) {
    if (tx.type !== 'despesa') continue;
    if (!withinHorizon(todayIso, tx.date, horizonDays)) continue;
    items.push({ date: tx.date, description: tx.notes || 'Lançamento manual', amount: tx.amount });
  }

  return items.sort((a, b) => a.date.localeCompare(b.date));
}
