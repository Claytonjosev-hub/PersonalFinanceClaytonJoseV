import type { Investment, IndexType } from '@/lib/data/investments';
import { formatBRL } from '@/lib/format';
import { saveInvestment, archiveInvestmentAction } from './actions';

const INDEX_OPTIONS: { value: IndexType; label: string }[] = [
  { value: 'cdi', label: 'CDI' },
  { value: 'ipca', label: 'IPCA' },
  { value: 'prefixado', label: 'Prefixado' },
];

function Row({ investment }: { investment: Investment }) {
  const rentabilidade = investment.current_amount - investment.invested_amount;
  return (
    <form
      action={saveInvestment}
      className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle bg-bg/40 p-3"
    >
      <input type="hidden" name="id" value={investment.id} />
      <input type="hidden" name="type" value="renda_fixa" />
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
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Valor investido</label>
        <input
          name="invested_amount"
          type="number"
          step="0.01"
          defaultValue={investment.invested_amount}
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
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
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Taxa</label>
        <input
          name="rate"
          defaultValue={investment.rate ?? ''}
          placeholder="110% CDI"
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Indexador</label>
        <select
          name="index_type"
          defaultValue={investment.index_type ?? ''}
          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        >
          <option value="">—</option>
          {INDEX_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Liquidez</label>
        <input
          name="liquidity"
          defaultValue={investment.liquidity ?? ''}
          placeholder="Diária, D+30..."
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Carência</label>
        <input
          name="grace_period"
          defaultValue={investment.grace_period ?? ''}
          className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Data de aplicação</label>
        <input
          name="applied_at"
          type="date"
          defaultValue={investment.applied_at ?? ''}
          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Vencimento</label>
        <input
          name="maturity_at"
          type="date"
          defaultValue={investment.maturity_at ?? ''}
          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Rentabilidade</label>
        <p
          className={
            'w-28 rounded-lg px-2 py-1 text-sm font-medium tabular-nums ' +
            (rentabilidade < 0 ? 'text-negative' : 'text-positive')
          }
        >
          {formatBRL(rentabilidade)}
        </p>
      </div>
      <button
        type="submit"
        className="rounded-lg border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-fg"
      >
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
      <input type="hidden" name="type" value="renda_fixa" />
      <div className="min-w-[8rem] flex-1 space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Descrição</label>
        <input
          name="description"
          placeholder="Ex: CDB Banco X"
          required
          className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Instituição</label>
        <input name="institution" className="w-32 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Valor investido</label>
        <input
          name="invested_amount"
          type="number"
          step="0.01"
          required
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
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
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Taxa</label>
        <input name="rate" placeholder="110% CDI" className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Indexador</label>
        <select name="index_type" defaultValue="" className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent">
          <option value="">—</option>
          {INDEX_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Liquidez</label>
        <input name="liquidity" placeholder="Diária, D+30..." className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Carência</label>
        <input name="grace_period" className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Data de aplicação</label>
        <input name="applied_at" type="date" className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Vencimento</label>
        <input name="maturity_at" type="date" className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent" />
      </div>
      <button type="submit" className="rounded-lg bg-accent px-3 py-1 text-sm font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90">
        Adicionar
      </button>
    </form>
  );
}

export function RendaFixa({ investments }: { investments: Investment[] }) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">Renda Fixa</h2>
      <div className="mt-4 space-y-2">
        {investments.map((inv) => (
          <Row key={inv.id} investment={inv} />
        ))}
        <NewRow />
      </div>
    </section>
  );
}
