import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { getParameters } from '@/lib/data/parameters';
import { listPaymentMethods } from '@/lib/data/payment-methods';
import { listCategories } from '@/lib/data/categories';
import { listRecurringIncomes, listRecurringExpenses } from '@/lib/data/recurring';
import { listDebts } from '@/lib/data/debts';
import { listTransactionsForRange } from '@/lib/data/transactions';
import { getMonthsAxis } from '@/lib/ledger/months';
import {
  computeMonthlyReceitas,
  computeMonthlyDespesas,
  computeSaldoAcumulado,
  computeDailyEntriesForMonth,
} from '@/lib/ledger/projection';
import { TabelaFluxo } from './tabela-fluxo';

export default async function FluxoCaixaPage() {
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

  // Resultado for every month in the axis, so the running saldo carries
  // forward correctly across every month boundary in the wide table below —
  // reusing computeSaldoAcumulado exactly like Controladoria does, so the
  // two screens can never disagree.
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

  const entriesByMonth = monthsAxis.map((m, index) => {
    const saldoInicioDoMes = index === 0 ? parameters.initial_balance : saldoAcumulado[index - 1];
    return computeDailyEntriesForMonth(
      m,
      parameters,
      recurringIncomes,
      recurringExpenses,
      debts,
      paymentMethods,
      transactions,
      saldoInicioDoMes
    );
  });

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen">
      <Nav activePath="/fluxo-caixa" />
      <main className="mx-auto flex max-w-full flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Fluxo de Caixa</h1>
        <TabelaFluxo
          monthsAxis={monthsAxis}
          entriesByMonth={entriesByMonth}
          resultados={resultados}
          todayIso={todayIso}
        />
      </main>
    </div>
  );
}
