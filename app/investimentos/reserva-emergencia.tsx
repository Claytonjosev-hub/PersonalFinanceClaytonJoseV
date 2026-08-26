import type { Investment } from '@/lib/data/investments';
import { saveInvestment, archiveInvestmentAction } from './actions';

function Row({ investment }: { investment: Investment }) {
  return (
    <form
      action={saveInvestment}
      className="flex flex-wrap items-end gap-2 rounded border border-border p-3"
    >
      <input type="hidden" name="id" value={investment.id} />
      <input type="hidden" name="type" value="reserva_emergencia" />
      <div className="min-w-[8rem] flex-1 space-y-1">
        <label className="text-xs text-fg/70">Descrição</label>
        <input
          name="description"
          defaultValue={investment.description}
          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Instituição</label>
        <input
          name="institution"
          defaultValue={investment.institution ?? ''}
          className="w-32 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Valor atual</label>
        <input
          name="current_amount"
          type="number"
          step="0.01"
          defaultValue={investment.current_amount}
          className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Liquidez</label>
        <input
          name="liquidity"
          defaultValue={investment.liquidity ?? 'Diária'}
          className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <button type="submit" className="rounded border border-border px-3 py-1 text-sm hover:bg-muted">
        Salvar
      </button>
      <button
        formAction={archiveInvestmentAction}
        className="rounded border border-border px-3 py-1 text-sm text-negative hover:bg-muted"
      >
        Arquivar
      </button>
    </form>
  );
}

function NewRow() {
  return (
    <form action={saveInvestment} className="flex flex-wrap items-end gap-2 rounded border border-border p-3">
      <input type="hidden" name="type" value="reserva_emergencia" />
      <div className="min-w-[8rem] flex-1 space-y-1">
        <label className="text-xs text-fg/70">Descrição</label>
        <input
          name="description"
          placeholder="Ex: Reserva — Nubank"
          required
          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Instituição</label>
        <input name="institution" className="w-32 rounded border border-border bg-bg px-2 py-1 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Valor atual</label>
        <input
          name="current_amount"
          type="number"
          step="0.01"
          required
          className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Liquidez</label>
        <input
          name="liquidity"
          defaultValue="Diária"
          className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <button type="submit" className="rounded bg-accent px-3 py-1 text-sm text-accent-foreground">
        Adicionar
      </button>
    </form>
  );
}

export function ReservaEmergencia({ investments }: { investments: Investment[] }) {
  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Reserva de Emergência</h2>
      <div className="mt-4 space-y-2">
        {investments.map((inv) => (
          <Row key={inv.id} investment={inv} />
        ))}
        <NewRow />
      </div>
    </section>
  );
}
