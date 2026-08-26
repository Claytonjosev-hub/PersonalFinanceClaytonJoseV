import type { DebtWithoutSchedule } from '@/lib/ledger/types';
import { formatBRL } from '@/lib/format';
import { saveDebtWithoutSchedule, archiveDebtWithoutScheduleAction } from './actions';

export function SemCronograma({ debts }: { debts: DebtWithoutSchedule[] }) {
  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Dívidas sem cronograma definido</h2>
      <div className="mt-4 space-y-2">
        {debts.map((debt) => (
          <form
            key={debt.id}
            action={saveDebtWithoutSchedule}
            className="flex flex-wrap items-center gap-2 rounded border border-border p-2"
          >
            <input type="hidden" name="id" value={debt.id} />
            <input
              name="description"
              defaultValue={debt.description}
              className="min-w-[8rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
            />
            <input
              name="creditor"
              defaultValue={debt.creditor}
              placeholder="Credor"
              className="w-32 rounded border border-border bg-bg px-2 py-1 text-sm"
            />
            <input
              name="open_balance"
              type="number"
              step="0.01"
              defaultValue={debt.open_balance}
              className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
            />
            <input
              name="notes"
              defaultValue={debt.notes ?? ''}
              placeholder="Observação"
              className="min-w-[8rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
            />
            <button
              type="submit"
              className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
            >
              Salvar
            </button>
            <button
              formAction={archiveDebtWithoutScheduleAction}
              className="rounded border border-border px-2 py-1 text-xs text-negative hover:bg-muted"
            >
              Arquivar
            </button>
          </form>
        ))}

        <form action={saveDebtWithoutSchedule} className="flex flex-wrap items-center gap-2 pt-1">
          <input
            name="description"
            placeholder="Descrição"
            required
            className="min-w-[8rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
          />
          <input
            name="creditor"
            placeholder="Credor"
            required
            className="w-32 rounded border border-border bg-bg px-2 py-1 text-sm"
          />
          <input
            name="open_balance"
            type="number"
            step="0.01"
            placeholder="0,00"
            required
            className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
          />
          <input
            name="notes"
            placeholder="Observação"
            className="min-w-[8rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground"
          >
            Adicionar
          </button>
        </form>
      </div>
      <p className="mt-2 text-xs tabular-nums text-fg/70">
        Soma em aberto: {formatBRL(debts.reduce((sum, d) => sum + d.open_balance, 0))}
      </p>
    </section>
  );
}
