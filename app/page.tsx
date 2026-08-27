import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { getParameters } from '@/lib/data/parameters';
import { listPaymentMethods } from '@/lib/data/payment-methods';
import { listCategories } from '@/lib/data/categories';
import { listRecurringIncomes, listRecurringExpenses } from '@/lib/data/recurring';
import { listDebts } from '@/lib/data/debts';
import { listDebtsWithoutSchedule } from '@/lib/data/debts-without-schedule';
import { listTransactionsForRange } from '@/lib/data/transactions';
import { getMonthsAxis, monthKeyFromDate, addMonths, monthsBetween } from '@/lib/ledger/months';
import type { MonthKey } from '@/lib/ledger/types';
import {
  computeMonthlyReceitas,
  computeMonthlyDespesas,
  computeSaldoAcumulado,
  computeDailyEntriesForMonth,
  computeUpcomingReceitas,
  computeUpcomingDespesas,
  daysBetweenIso,
} from '@/lib/ledger/projection';
import { totalCommittedByPaymentMethod } from '@/lib/ledger/debts';
import { DashboardInicio } from './dashboard-inicio';

const HORIZON_DAYS = 30;

function isoForMonth(month: MonthKey, day: number): string {
  return `${month.year}-${String(month.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Every month from `start_month` through `today`, independent of
// `projection_months` — so the balance chain below stays correct even if the
// configured projection window doesn't happen to cover today.
function monthsUpToToday(startMonth: string, today: MonthKey): MonthKey[] {
  const months: MonthKey[] = [];
  let cursor = monthKeyFromDate(startMonth);
  while (monthsBetween(cursor, today) >= 0) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months.length > 0 ? months : [today];
}

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');

  const [parameters, paymentMethods, categories, recurringIncomes, recurringExpenses, debts, debtsWithoutSchedule] =
    await Promise.all([
      getParameters(),
      listPaymentMethods(),
      listCategories(),
      listRecurringIncomes(),
      listRecurringExpenses(),
      listDebts(),
      listDebtsWithoutSchedule(),
    ]);

  // Should never happen — the handle_new_user trigger (Plan 1 Task 3)
  // creates one parameters row per user at signup.
  if (!parameters) {
    return (
      <div className="min-h-screen">
        <Nav activePath="/" />
        <main className="mx-auto flex max-w-md flex-col gap-6 p-6 sm:p-8">
          <p className="text-sm text-fg/70">
            Não encontramos seus parâmetros ainda. Configure-os em{' '}
            <a href="/parametros" className="text-accent hover:underline">
              Parâmetros
            </a>
            .
          </p>
        </main>
      </div>
    );
  }

  const todayIso = new Date().toISOString().slice(0, 10);
  const todayDay = Number(todayIso.slice(8, 10));
  const currentMonth = monthKeyFromDate(todayIso);
  const nextMonth = addMonths(currentMonth, 1);

  const monthsToToday = monthsUpToToday(parameters.start_month, currentMonth);
  const transactionsRangeEnd = addMonths(currentMonth, 2);
  const transactions = await listTransactionsForRange(
    monthsToToday[0].year,
    monthsToToday[0].month,
    transactionsRangeEnd.year,
    transactionsRangeEnd.month
  );

  // Balance chain up to the start of today, exactly like Fluxo de Caixa —
  // so "Saldo atual" here always agrees with that screen.
  const resultados = monthsToToday.map((m) => {
    const receitas = computeMonthlyReceitas(m, recurringIncomes, transactions, categories);
    const despesas = computeMonthlyDespesas(m, debts, recurringExpenses, transactions, paymentMethods, categories);
    return receitas.total - despesas.total;
  });
  const saldoAcumulado = computeSaldoAcumulado(parameters.initial_balance, resultados);
  const saldoInicioMesAtual =
    monthsToToday.length > 1 ? saldoAcumulado[saldoAcumulado.length - 2] : parameters.initial_balance;
  const saldoFimMesAtual = saldoAcumulado[saldoAcumulado.length - 1];

  const entriesCurrentMonth = computeDailyEntriesForMonth(
    currentMonth,
    parameters,
    recurringIncomes,
    recurringExpenses,
    debts,
    paymentMethods,
    transactions,
    saldoInicioMesAtual
  );
  const entriesNextMonth = computeDailyEntriesForMonth(
    nextMonth,
    parameters,
    recurringIncomes,
    recurringExpenses,
    debts,
    paymentMethods,
    transactions,
    saldoFimMesAtual
  );

  const todayEntry = entriesCurrentMonth.find((e) => e.day === todayDay);
  const saldoAtual = todayEntry ? todayEntry.saldo : saldoInicioMesAtual;

  // "Disponível para gastar" = the lowest projected balance between today
  // and the next salary date (found by scanning the same daily entries the
  // Fluxo de Caixa table uses, so it never disagrees with that screen).
  // Falls back to the lowest balance in the horizon window when no salary
  // is configured or none falls within the next two months.
  const salaryDayThisMonth =
    entriesCurrentMonth.find((e) => e.day >= todayDay && e.receitasAutomaticas > 0)?.day ?? null;

  let proximoSalarioIso: string | null = null;
  let disponivel = saldoAtual;

  if (salaryDayThisMonth != null) {
    proximoSalarioIso = isoForMonth(currentMonth, salaryDayThisMonth);
    const window = entriesCurrentMonth.filter((e) => e.day >= todayDay && e.day <= salaryDayThisMonth);
    disponivel = Math.min(...window.map((e) => e.saldo));
  } else {
    const salaryDayNextMonth = entriesNextMonth.find((e) => e.receitasAutomaticas > 0)?.day ?? null;
    const restOfThisMonth = entriesCurrentMonth.filter((e) => e.day >= todayDay);

    if (salaryDayNextMonth != null) {
      proximoSalarioIso = isoForMonth(nextMonth, salaryDayNextMonth);
      const partNextMonth = entriesNextMonth.filter((e) => e.day <= salaryDayNextMonth);
      disponivel = Math.min(...restOfThisMonth.map((e) => e.saldo), ...partNextMonth.map((e) => e.saldo));
    } else {
      const window = [
        ...restOfThisMonth.map((e) => ({ iso: isoForMonth(currentMonth, e.day), saldo: e.saldo })),
        ...entriesNextMonth.map((e) => ({ iso: isoForMonth(nextMonth, e.day), saldo: e.saldo })),
      ].filter((e) => daysBetweenIso(todayIso, e.iso) <= HORIZON_DAYS);
      disponivel = window.length > 0 ? Math.min(...window.map((e) => e.saldo)) : saldoAtual;
    }
  }

  // Total em dívidas — same figures as the Dívidas page's "Endividamento
  // total", which depends on the full configured projection window.
  const monthsAxis = getMonthsAxis(parameters.start_month, parameters.projection_months);
  const committed = totalCommittedByPaymentMethod(debts, monthsAxis, currentMonth);
  const comCronograma = Object.values(committed).reduce((sum, v) => sum + v, 0);
  const semCronograma = debtsWithoutSchedule.reduce((sum, d) => sum + d.open_balance, 0);
  const totalDividas = comCronograma + semCronograma;

  const upcomingReceitas = computeUpcomingReceitas(
    todayIso,
    HORIZON_DAYS,
    parameters,
    recurringIncomes,
    transactions
  );
  const upcomingDespesas = computeUpcomingDespesas(
    todayIso,
    HORIZON_DAYS,
    debts,
    recurringExpenses,
    paymentMethods,
    transactions
  );

  return (
    <div className="min-h-screen">
      <Nav activePath="/" />
      <main className="mx-auto flex max-w-5xl flex-col gap-8 p-6 sm:p-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Início</h1>
          <p className="mt-1 text-sm text-fg/60">
            Logado como <span className="font-medium text-fg/80">{data.user!.email}</span>
          </p>
        </div>
        <DashboardInicio
          saldoAtual={saldoAtual}
          disponivel={disponivel}
          proximoSalarioIso={proximoSalarioIso}
          horizonDays={HORIZON_DAYS}
          totalDividas={totalDividas}
          upcomingReceitas={upcomingReceitas}
          upcomingDespesas={upcomingDespesas}
        />
      </main>
    </div>
  );
}
