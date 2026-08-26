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
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        <NovoLancamento categories={categories} paymentMethods={paymentMethods} />

        <section className="rounded border border-border p-6">
          <h2 className="text-lg font-semibold">Lançamentos recentes</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border-b border-border p-2 text-left">Data</th>
                  <th className="border-b border-border p-2 text-left">Tipo</th>
                  <th className="border-b border-border p-2 text-left">Categoria</th>
                  <th className="border-b border-border p-2 text-left">Forma de pagamento</th>
                  <th className="border-b border-border p-2 text-right">Valor</th>
                  <th className="border-b border-border p-2"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => (
                  <tr key={tx.id}>
                    <td className="border-b border-border p-2 tabular-nums">{tx.date}</td>
                    <td className="border-b border-border p-2">
                      <span
                        className={
                          tx.type === 'receita' ? 'text-positive' : 'text-negative'
                        }
                      >
                        {tx.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="border-b border-border p-2">{categoryName(tx.category_id)}</td>
                    <td className="border-b border-border p-2">
                      {paymentMethodName(tx.payment_method_id)}
                    </td>
                    <td className="border-b border-border p-2 text-right tabular-nums">
                      {formatBRL(tx.amount)}
                    </td>
                    <td className="border-b border-border p-2 text-right">
                      <form action={deleteTransactionAction}>
                        <input type="hidden" name="id" value={tx.id} />
                        <button className="text-xs text-negative hover:underline">Excluir</button>
                      </form>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-fg/70">
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
