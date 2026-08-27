import type { Investment } from '@/lib/data/investments';
import { formatBRL } from '@/lib/format';
import { saveInvestment, archiveInvestmentAction } from './actions';

function rentabilidade(inv: Investment): number | null {
  if (inv.quantity == null || inv.average_price == null) return null;
  return inv.current_amount - inv.quantity * inv.average_price;
}

function Row({ investment }: { investment: Investment }) {
  const rent = rentabilidade(investment);
  return (
    <form
      action={saveInvestment}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle bg-bg/40 p-3"
    >
      <input type="hidden" name="id" value={investment.id} />
      <input type="hidden" name="type" value="renda_variavel" />
      <div className="min-w-[6rem] space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Ticker / Descrição</label>
        <input
          name="description"
          defaultValue={investment.description}
          className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Instituição/corretora</label>
        <input
          name="institution"
          defaultValue={investment.institution ?? ''}
          className="w-32 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Quantidade</label>
        <input
          name="quantity"
          type="number"
          step="0.000001"
          defaultValue={investment.quantity ?? ''}
          className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Preço médio</label>
        <input
          name="average_price"
          type="number"
          step="0.01"
          defaultValue={investment.average_price ?? ''}
          className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
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
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Rentabilidade</label>
        <p
          className={
            'w-28 rounded-lg px-2 py-1 text-sm font-medium tabular-nums ' +
            (rent == null ? 'text-fg/50' : rent < 0 ? 'text-negative' : 'text-positive')
          }
        >
          {rent == null ? '—' : formatBRL(rent)}
        </p>
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
      <input type="hidden" name="type" value="renda_variavel" />
      <div className="min-w-[6rem] space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Ticker / Descrição</label>
        <input
          name="description"
          placeholder="Ex: PETR4"
          required
          className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Instituição/corretora</label>
        <input name="institution" className="w-32 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Quantidade</label>
        <input
          name="quantity"
          type="number"
          step="0.000001"
          required
          className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Preço médio</label>
        <input
          name="average_price"
          type="number"
          step="0.01"
          required
          className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
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
      <button type="submit" className="rounded-lg bg-accent px-3 py-1 text-sm font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90">
        Adicionar
      </button>
    </form>
  );
}

export function RendaVariavel({ investments }: { investments: Investment[] }) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">Renda Variável</h2>
      <div className="mt-4 space-y-2">
        {investments.map((inv) => (
          <Row key={inv.id} investment={inv} />
        ))}
        <NewRow />
      </div>
    </section>
  );
}
