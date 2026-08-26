'use client';

import { useState } from 'react';
import { saveTransaction } from '@/app/lancamentos/actions';
import { formatBRL } from '@/lib/format';

// A single "cell" in the Fluxo de Caixa grid that behaves like a spreadsheet
// cell: click it to open a tiny inline form and lançar a manual transaction
// directly on that day, without leaving the screen. This is the fast path
// for testing "se eu lanço uma parcela/valor aqui, ele aparece no fluxo".
export function CelulaLancamento({
  date,
  type,
  amount,
}: {
  date: string;
  type: 'receita' | 'despesa';
  amount: number;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    try {
      await saveTransaction(formData);
      setEditing(false);
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <form action={handleSubmit} className="flex items-center justify-end gap-1">
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="type" value={type} />
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          autoFocus
          required
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditing(false);
          }}
          className="w-16 rounded border border-accent bg-bg px-1 py-0.5 text-right text-xs tabular-nums"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-xs text-accent disabled:opacity-50"
          title="Lançar"
        >
          ✓
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-fg/50"
          title="Cancelar"
        >
          ✕
        </button>
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="w-full rounded px-1 text-right tabular-nums hover:bg-muted"
      title={`Clique para lançar uma ${type === 'receita' ? 'receita' : 'despesa'} manual em ${date}`}
    >
      {amount === 0 ? '—' : formatBRL(amount)}
    </button>
  );
}
