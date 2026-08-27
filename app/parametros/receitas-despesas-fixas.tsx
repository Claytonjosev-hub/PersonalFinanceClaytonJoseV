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
      <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Receitas mensais padrão</h2>
          <span className="rounded-full bg-positive/10 px-2.5 py-1 text-sm font-medium tabular-nums text-positive">{formatBRL(totalIncomes)}</span>
        </div>
        <div className="mt-4 space-y-2">
          {recurringIncomes.map((income) => (
            <form
              key={income.id}
              action={saveRecurringIncome}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-bg/40 p-2"
            >
              <input type="hidden" name="id" value={income.id} />
              <input
                name="description"
                defaultValue={income.description}
                className="min-w-[8rem] flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <input
                name="amount"
                type="number"
                step="0.01"
                defaultValue={income.amount}
                className="w-32 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <button
                type="submit"
                className="rounded-lg border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted hover:text-fg"
              >
                Salvar
              </button>
              <button
                formAction={deleteRecurringIncomeAction}
                className="rounded-lg border border-negative/30 px-2 py-1 text-xs font-medium text-negative transition-colors hover:bg-negative/10"
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
              className="min-w-[8rem] flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <input
              name="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              required
              className="w-32 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-2 py-1 text-xs font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90"
            >
              Adicionar
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Despesas fixas mensais</h2>
          <span className="rounded-full bg-negative/10 px-2.5 py-1 text-sm font-medium tabular-nums text-negative">{formatBRL(totalExpenses)}</span>
        </div>
        <div className="mt-4 space-y-2">
          {recurringExpenses.map((expense) => (
            <form
              key={expense.id}
              action={saveRecurringExpense}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-bg/40 p-2"
            >
              <input type="hidden" name="id" value={expense.id} />
              <input
                name="description"
                defaultValue={expense.description}
                className="min-w-[8rem] flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <select
                name="payment_method_id"
                defaultValue={expense.payment_method_id ?? ''}
                className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
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
                className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
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
                className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
              <button
                type="submit"
                className="rounded-lg border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted hover:text-fg"
              >
                Salvar
              </button>
              <button
                formAction={deleteRecurringExpenseAction}
                className="rounded-lg border border-negative/30 px-2 py-1 text-xs font-medium text-negative transition-colors hover:bg-negative/10"
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
              className="min-w-[8rem] flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <select
              name="payment_method_id"
              defaultValue=""
              className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
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
              className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
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
              className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent px-2 py-1 text-xs font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90"
            >
              Adicionar
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
