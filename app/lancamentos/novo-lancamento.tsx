'use client';

import { useRef, useState } from 'react';
import type { Category, PaymentMethod } from '@/lib/ledger/types';
import { saveTransaction } from './actions';

function todayIso(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export function NovoLancamento({
  categories,
  paymentMethods,
}: {
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  const [type, setType] = useState<'receita' | 'despesa'>('despesa');
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const filteredCategories = categories.filter((c) => c.type === type && !c.archived_at);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await saveTransaction(formData);
      formRef.current?.reset();
      amountRef.current?.focus();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface p-4 shadow-soft sm:p-6"
    >
      <div className="flex gap-1 rounded-full border border-border bg-muted/40 p-1 text-sm">
        {(['despesa', 'receita'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={
              'rounded-full px-3 py-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ' +
              (type === option
                ? 'bg-accent text-accent-foreground shadow-soft'
                : 'text-fg/60 hover:bg-muted hover:text-fg')
            }
          >
            {option === 'despesa' ? 'Despesa' : 'Receita'}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Data</label>
        <input
          name="date"
          type="date"
          defaultValue={todayIso()}
          required
          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Categoria</label>
        <select
          name="category_id"
          defaultValue=""
          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        >
          <option value="">—</option>
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Valor</label>
        <input
          ref={amountRef}
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Forma de pagamento</label>
        <select
          name="payment_method_id"
          defaultValue=""
          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        >
          <option value="">—</option>
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>
              {pm.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[8rem] flex-1 space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Observação</label>
        <input
          name="notes"
          className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 sm:w-auto"
      >
        {pending ? 'Salvando…' : 'Lançar'}
      </button>
    </form>
  );
}
