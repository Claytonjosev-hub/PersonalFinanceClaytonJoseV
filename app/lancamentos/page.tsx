import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';
import { listCategories } from '@/lib/data/categories';
import { listPaymentMethods } from '@/lib/data/payment-methods';
import { listRecentTransactions } from '@/lib/data/transactions';
import { formatBRL } from '@/lib/format';
import { NovoLancamento } from './novo-lancamento';
import { deleteTransactionAction } from './actions';

export default async function LancamentosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [categories, paymentMethods, recent] = await Promise.all([
    listCategories(),
    listPaymentMethods(),
    listRecentTransactions(50),
  ]);

  function categoryName(id: string | null) {
    if (!id) return '—';
    return categories.find((c) => c.id === id)?.name ?? 'Categoria removida';
  }

  function paymentMethodName(id: string | null) {
    if (!id) return '—';
    return paymentMethods.find((pm) => pm.id === id)?.name ?? 'Forma removida';
  }

  return (
    <div className="min-h-screen">
      <Nav activePath="/lancamentos" />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">Lançamentos</h1>
        <NovoLancamento categories={categories} paymentMethods={paymentMethods} />

        <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
          <h2 className="text-lg font-semibold tracking-tight">Lançamentos recentes</h2>
          <div className="mt-4 overflow-x-auto rounded-lg">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border-subtle bg-muted/70 p-2.5 text-left text-xs font-medium uppercase tracking-wide text-fg/60">
                    Data
                  </th>
                  <th className="border-b border-border-subtle bg-muted/70 p-2.5 text-left text-xs font-medium uppercase tracking-wide text-fg/60">
                    Tipo
                  </th>
                  <th className="border-b border-border-subtle bg-muted/70 p-2.5 text-left text-xs font-medium uppercase tracking-wide text-fg/60">
                    Categoria
                  </th>
                  <th className="border-b border-border-subtle bg-muted/70 p-2.5 text-left text-xs font-medium uppercase tracking-wide text-fg/60">
                    Forma de pagamento
                  </th>
                  <th className="border-b border-border-subtle bg-muted/70 p-2.5 text-right text-xs font-medium uppercase tracking-wide text-fg/60">
                    Valor
                  </th>
                  <th className="border-b border-border-subtle bg-muted/70 p-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => (
                  <tr key={tx.id} className="even:bg-fg/[0.02] hover:bg-muted/40">
                    <td className="border-b border-border-subtle p-2 tabular-nums text-fg/70">
                      {tx.date}
                    </td>
                    <td className="border-b border-border-subtle p-2">
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-xs font-medium ' +
                          (tx.type === 'receita'
                            ? 'bg-positive/10 text-positive'
                            : 'bg-negative/10 text-negative')
                        }
                      >
                        {tx.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="border-b border-border-subtle p-2">{categoryName(tx.category_id)}</td>
                    <td className="border-b border-border-subtle p-2">
                      {paymentMethodName(tx.payment_method_id)}
                    </td>
                    <td className="border-b border-border-subtle p-2 text-right tabular-nums">
                      {formatBRL(tx.amount)}
                    </td>
                    <td className="border-b border-border-subtle p-2 text-right">
                      <form action={deleteTransactionAction}>
                        <input type="hidden" name="id" value={tx.id} />
                        <button className="rounded-md px-1.5 py-0.5 text-xs font-medium text-negative transition-colors hover:bg-negative/10">
                          Excluir
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-sm text-fg/60">
                      Nenhum lançamento ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
