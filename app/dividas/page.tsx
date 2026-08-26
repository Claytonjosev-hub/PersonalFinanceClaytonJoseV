import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { getParameters } from '@/lib/data/parameters';
import { listPaymentMethods } from '@/lib/data/payment-methods';
import { listCategories } from '@/lib/data/categories';
import { listDebts } from '@/lib/data/debts';
import { listDebtsWithoutSchedule } from '@/lib/data/debts-without-schedule';
import { getMonthsAxis, monthKeyFromDate } from '@/lib/ledger/months';
import { CadastroDividas } from './cadastro-dividas';
import { Cronograma } from './cronograma';
import { TotaisPorFormaPagamento } from './totais-por-forma-pagamento';
import { SemCronograma } from './sem-cronograma';
import { EndividamentoTotal } from './endividamento-total';

export default async function DividasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [parameters, paymentMethods, categories, debts, debtsWithoutSchedule] = await Promise.all([
    getParameters(),
    listPaymentMethods(),
    listCategories(),
    listDebts(),
    listDebtsWithoutSchedule(),
  ]);

  if (!parameters) redirect('/');

  const monthsAxis = getMonthsAxis(parameters.start_month, parameters.projection_months);
  // Current month is derived at request time, never stored, consistent with
  // the "never store what can be calculated" rule.
  const currentMonth = monthKeyFromDate(new Date().toISOString().slice(0, 10));
  const despesaCategorias = categories.filter((c) => c.type === 'despesa' && !c.archived_at);

  return (
    <div className="min-h-screen">
      <Nav activePath="/dividas" />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Dívidas e Parcelamentos</h1>
        <CadastroDividas
          debts={debts}
          monthsAxis={monthsAxis}
          currentMonth={currentMonth}
          paymentMethods={paymentMethods}
          categories={despesaCategorias}
        />
        <Cronograma debts={debts} monthsAxis={monthsAxis} />
        <TotaisPorFormaPagamento
          debts={debts}
          monthsAxis={monthsAxis}
          currentMonth={currentMonth}
          paymentMethods={paymentMethods}
        />
        <SemCronograma debts={debtsWithoutSchedule} />
        <EndividamentoTotal
          debts={debts}
          debtsWithoutSchedule={debtsWithoutSchedule}
          monthsAxis={monthsAxis}
          currentMonth={currentMonth}
        />
      </main>
    </div>
  );
}
