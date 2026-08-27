import type { Investment } from '@/lib/data/investments';
import { saveInvestment, archiveInvestmentAction } from './actions';

function Row({ investment }: { investment: Investment }) {
  return (
    <form
      action={saveInvestment}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle bg-bg/40 p-3"
    >
      <input type="hidden" name="id" value={investment.id} />
      <input type="hidden" name="type" value="reserva_emergencia" />
      <div className="min-w-[8rem] flex-1 space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Descrição</label>
        <input
          name="description"
          defaultValue={investment.description}
          className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Instituição</label>
        <input
          name="institution"
          defaultValue={investment.institution ?? ''}
          className="w-32 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Valor atual</label>
        <input
          name="current_amount"
          type="number"
          step="0.01"
          defaultValue={investment.current_amount}
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Liquidez</label>
        <input
          name="liquidity"
          defaultValue={investment.liquidity ?? 'Diária'}
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <button type="submit" className="rounded-lg border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-fg">
        Salvar
      </button>
      <button
        formAction={archiveInvestmentAction}
        className="rounded-lg border border-negative/30 px-3 py-1 text-sm font-medium text-negative transition-colors hover:bg-negative/10"
      >
        Arquivar
      </button>
    </form>
  );
}

function NewRow() {
  return (
    <form action={saveInvestment} className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle bg-bg/40 p-3">
      <input type="hidden" name="type" value="reserva_emergencia" />
      <div className="min-w-[8rem] flex-1 space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Descrição</label>
        <input
          name="description"
          placeholder="Ex: Reserva — Nubank"
          required
          className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Instituição</label>
        <input name="institution" className="w-32 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Valor atual</label>
        <input
          name="current_amount"
          type="number"
          step="0.01"
          required
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Liquidez</label>
        <input
          name="liquidity"
          defaultValue="Diária"
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <button type="submit" className="rounded-lg bg-accent px-3 py-1 text-sm font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90">
        Adicionar
      </button>
    </form>
  );
}

export function ReservaEmergencia({ investments }: { investments: Investment[] }) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">Reserva de Emergência</h2>
      <div className="mt-4 space-y-2">
        {investments.map((inv) => (
          <Row key={inv.id} investment={inv} />
        ))}
        <NewRow />
      </div>
    </section>
  );
}
