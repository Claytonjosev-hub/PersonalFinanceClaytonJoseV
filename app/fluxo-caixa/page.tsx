import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { getParameters } from '@/lib/data/parameters';
import { listPaymentMethods } from '@/lib/data/payment-methods';
import { listCategories } from '@/lib/data/categories';
import { listRecurringIncomes, listRecurringExpenses } from '@/lib/data/recurring';
import { listDebts } from '@/lib/data/debts';
import { listTransactionsForRange } from '@/lib/data/transactions';
import { getMonthsAxis, monthKeyFromDate } from '@/lib/ledger/months';
import {
  computeMonthlyReceitas,
  computeMonthlyDespesas,
  computeSaldoAcumulado,
  computeDailyEntriesForMonth,
} from '@/lib/ledger/projection';
import { NavegacaoMes } from './navegacao-mes';
import { TabelaDias } from './tabela-dias';

export default async function FluxoCaixaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [parameters, paymentMethods, categories, recurringIncomes, recurringExpenses, debts] =
    await Promise.all([
      getParameters(),
      listPaymentMethods(),
      listCategories(),
      listRecurringIncomes(),
      listRecurringExpenses(),
      listDebts(),
    ]);

  if (!parameters) redirect('/');

  const monthsAxis = getMonthsAxis(parameters.start_month, parameters.projection_months);
  const firstMonth = monthsAxis[0];
  const lastMonth = monthsAxis[monthsAxis.length - 1];
  const transactions = await listTransactionsForRange(
    firstMonth.year,
    firstMonth.month,
    lastMonth.year,
    lastMonth.month
  );

  const { mes } = await searchParams;
  const todayMonth = monthKeyFromDate(new Date().toISOString().slice(0, 10));
  const defaultIndex = Math.max(
    0,
    monthsAxis.findIndex((m) => m.year === todayMonth.year && m.month === todayMonth.month)
  );
  const requestedIndex = mes ? Number(mes) : defaultIndex;
  const selectedIndex = Math.min(Math.max(requestedIndex, 0), monthsAxis.length - 1);

  // Resultados for every month up to (but not including) the selected one,
  // to derive the correct starting balance for the selected month's first
  // day — reusing computeSaldoAcumulado exactly like Controladoria does.
  const resultados = monthsAxis.map((m) => {
    const receitas = computeMonthlyReceitas(m, recurringIncomes, transactions, categories);
    const despesas = computeMonthlyDespesas(
      m,
      debts,
      recurringExpenses,
      transactions,
      paymentMethods,
      categories
    );
    return receitas.total - despesas.total;
  });
  const saldoAcumulado = computeSaldoAcumulado(parameters.initial_balance, resultados);
  const saldoInicioDoMes =
    selectedIndex === 0 ? parameters.initial_balance : saldoAcumulado[selectedIndex - 1];

  const selectedMonth = monthsAxis[selectedIndex];
  const entries = computeDailyEntriesForMonth(
    selectedMonth,
    parameters,
    recurringIncomes,
    recurringExpenses,
    debts,
    paymentMethods,
    transactions,
    saldoInicioDoMes
  );

  return (
    <div className="min-h-screen">
      <Nav activePath="/fluxo-caixa" />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Fluxo de Caixa</h1>
        <NavegacaoMes monthsAxis={monthsAxis} selectedIndex={selectedIndex} />
        <TabelaDias entries={entries} resultadoDoMes={resultados[selectedIndex]} />
      </main>
    </div>
  );
}
