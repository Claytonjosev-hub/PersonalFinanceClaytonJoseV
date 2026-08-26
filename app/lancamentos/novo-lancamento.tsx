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
      className="flex flex-wrap items-end gap-2 rounded border border-border p-4"
    >
      <div className="flex gap-1 rounded-full border border-border p-1 text-sm">
        {(['despesa', 'receita'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setType(option)}
            className={
              'rounded-full px-3 py-1 transition-colors ' +
              (type === option ? 'bg-accent text-accent-foreground' : 'text-fg/70 hover:bg-muted')
            }
          >
            {option === 'despesa' ? 'Despesa' : 'Receita'}
          </button>
        ))}
      </div>
      <input type="hidden" name="type" value={type} />

      <div className="space-y-1">
        <label className="text-xs text-fg/70">Data</label>
        <input
          name="date"
          type="date"
          defaultValue={todayIso()}
          required
          className="rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-fg/70">Categoria</label>
        <select
          name="category_id"
          defaultValue=""
          className="rounded border border-border bg-bg px-2 py-1 text-sm"
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
        <label className="text-xs text-fg/70">Valor</label>
        <input
          ref={amountRef}
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-fg/70">Forma de pagamento</label>
        <select
          name="payment_method_id"
          defaultValue=""
          className="rounded border border-border bg-bg px-2 py-1 text-sm"
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
        <label className="text-xs text-fg/70">Observação</label>
        <input
          name="notes"
          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-accent px-4 py-2 text-sm text-accent-foreground disabled:opacity-50"
      >
        {pending ? 'Salvando…' : 'Lançar'}
      </button>
    </form>
  );
}
