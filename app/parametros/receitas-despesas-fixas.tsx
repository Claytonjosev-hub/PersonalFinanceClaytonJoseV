import type { PaymentMethod, Category, RecurringIncome, RecurringExpense } from '@/lib/ledger/types';
import { sumRecurringIncomes, sumRecurringExpenses } from '@/lib/ledger/recurring';
import { formatBRL } from '@/lib/format';
import {
  saveRecurringIncome,
  deleteRecurringIncomeAction,
  saveRecurringExpense,
  deleteRecurringExpenseAction,
} from './actions';

export function ReceitasDespesasFixas({
  recurringIncomes,
  recurringExpenses,
  paymentMethods,
  categories,
}: {
  recurringIncomes: RecurringIncome[];
  recurringExpenses: RecurringExpense[];
  paymentMethods: PaymentMethod[];
  categories: Category[];
}) {
  const totalIncomes = sumRecurringIncomes(recurringIncomes);
  const totalExpenses = sumRecurringExpenses(recurringExpenses);
  const despesaCategorias = categories.filter((c) => c.type === 'despesa' && !c.archived_at);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded border border-border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Receitas mensais padrão</h2>
          <span className="text-sm tabular-nums text-positive">{formatBRL(totalIncomes)}</span>
        </div>
        <div className="mt-4 space-y-2">
          {recurringIncomes.map((income) => (
            <form
              key={income.id}
              action={saveRecurringIncome}
              className="flex flex-wrap items-center gap-2 rounded border border-border p-2"
            >
              <input type="hidden" name="id" value={income.id} />
              <input
                name="description"
                defaultValue={income.description}
                className="min-w-[8rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
              />
              <input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={income.amount}
                className="w-32 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
              />
              <button
                type="submit"
                className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
              >
                Salvar
              </button>
              <button
                formAction={deleteRecurringIncomeAction}
                className="rounded border border-border px-2 py-1 text-xs text-negative hover:bg-muted"
              >
                Remover
              </button>
            </form>
          ))}
          <form action={saveRecurringIncome} className="flex flex-wrap items-center gap-2 pt-1">
            <input
              name="description"
              placeholder="Ex: Salário líquido"
              required
              className="min-w-[8rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              required
              className="w-32 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
            />
            <button
              type="submit"
              className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground"
            >
              Adicionar
            </button>
          </form>
        </div>
      </section>

      <section className="rounded border border-border p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Despesas fixas mensais</h2>
          <span className="text-sm tabular-nums text-negative">{formatBRL(totalExpenses)}</span>
        </div>
        <div className="mt-4 space-y-2">
          {recurringExpenses.map((expense) => (
            <form
              key={expense.id}
              action={saveRecurringExpense}
              className="flex flex-wrap items-center gap-2 rounded border border-border p-2"
            >
              <input type="hidden" name="id" value={expense.id} />
              <input
                name="description"
                defaultValue={expense.description}
                className="min-w-[8rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
              />
              <select
                name="payment_method_id"
                defaultValue={expense.payment_method_id ?? ''}
                className="rounded border border-border bg-bg px-2 py-1 text-sm"
              >
                <option value="">Forma de pagamento</option>
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.name}
                  </option>
                ))}
              </select>
              <select
                name="category_id"
                defaultValue={expense.category_id ?? ''}
                className="rounded border border-border bg-bg px-2 py-1 text-sm"
              >
                <option value="">Categoria</option>
                {despesaCategorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={expense.amount}
                className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
              />
              <button
                type="submit"
                className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
              >
                Salvar
              </button>
              <button
                formAction={deleteRecurringExpenseAction}
                className="rounded border border-border px-2 py-1 text-xs text-negative hover:bg-muted"
              >
                Remover
              </button>
            </form>
          ))}
          <form action={saveRecurringExpense} className="flex flex-wrap items-center gap-2 pt-1">
            <input
              name="description"
              placeholder="Ex: Assinatura Spotify"
              required
              className="min-w-[8rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
            />
            <select
              name="payment_method_id"
              defaultValue=""
              className="rounded border border-border bg-bg px-2 py-1 text-sm"
            >
              <option value="">Forma de pagamento</option>
              {paymentMethods.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.name}
                </option>
              ))}
            </select>
            <select
              name="category_id"
              defaultValue=""
              className="rounded border border-border bg-bg px-2 py-1 text-sm"
            >
              <option value="">Categoria</option>
              {despesaCategorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              required
              className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
            />
            <button
              type="submit"
              className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground"
            >
              Adicionar
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
