import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { getParameters } from '@/lib/data/parameters';
import { listPaymentMethods } from '@/lib/data/payment-methods';
import { listCategories } from '@/lib/data/categories';
import { listRecurringIncomes, listRecurringExpenses } from '@/lib/data/recurring';
import { getMonthsAxis } from '@/lib/ledger/months';
import { ConfiguracaoGeral } from './configuracao-geral';
import { FormasPagamento } from './formas-pagamento';
import { Categorias } from './categorias';
import { ReceitasDespesasFixas } from './receitas-despesas-fixas';

export default async function ParametrosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [parameters, paymentMethods, categories, recurringIncomes, recurringExpenses] =
    await Promise.all([
      getParameters(),
      listPaymentMethods(),
      listCategories(),
      listRecurringIncomes(),
      listRecurringExpenses(),
    ]);

  if (!parameters) {
    // Should never happen — the handle_new_user trigger (Plan 1 Task 3)
    // creates one parameters row per user at signup.
    redirect('/');
  }

  const monthsAxis = getMonthsAxis(parameters.start_month, parameters.projection_months);

  return (
    <div className="min-h-screen">
      <Nav activePath="/parametros" />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Parâmetros</h1>
        <ConfiguracaoGeral parameters={parameters} />
        <FormasPagamento paymentMethods={paymentMethods} />
        <Categorias categories={categories} />
        <ReceitasDespesasFixas
          recurringIncomes={recurringIncomes}
          recurringExpenses={recurringExpenses}
          paymentMethods={paymentMethods}
          categories={categories}
        />
        <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
          <h2 className="text-lg font-semibold tracking-tight">Eixo de meses</h2>
          <p className="mt-1 text-sm text-fg/70">
            Somente leitura — calculado a partir do mês inicial e do nº de meses projetados.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {monthsAxis.map((m) => (
              <li
                key={`${m.year}-${m.month}`}
                className="rounded-full border border-border-subtle bg-muted px-3 py-1 text-sm tabular-nums text-fg/70"
              >
                {m.label}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
