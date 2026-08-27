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
  computeIndicadores,
  totalDebtInstallmentsForMonth,
} from '@/lib/ledger/projection';
import { TabelaControladoria } from './tabela-controladoria';

export default async function ControladoriaPage() {
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

  const monthlyReceitas = monthsAxis.map((m) =>
    computeMonthlyReceitas(m, recurringIncomes, transactions, categories)
  );
  const monthlyDespesas = monthsAxis.map((m) =>
    computeMonthlyDespesas(m, debts, recurringExpenses, transactions, paymentMethods, categories)
  );
  const resultados = monthsAxis.map((m, i) => monthlyReceitas[i].total - monthlyDespesas[i].total);
  const saldoAcumulado = computeSaldoAcumulado(parameters.initial_balance, resultados);
  const indicadores = monthsAxis.map((m, i) =>
    computeIndicadores(
      monthlyReceitas[i].total,
      monthlyDespesas[i].total,
      totalDebtInstallmentsForMonth(debts, m)
    )
  );

  return (
    <div className="min-h-screen">
      <Nav activePath="/controladoria" />
      <main className="mx-auto flex max-w-full flex-col gap-8 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Controladoria</h1>
        <TabelaControladoria
          monthsAxis={monthsAxis}
          monthlyReceitas={monthlyReceitas}
          monthlyDespesas={monthlyDespesas}
          saldoAcumulado={saldoAcumulado}
          indicadores={indicadores}
        />
      </main>
    </div>
  );
}
