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
      className="flex flex-wrap items-end gap-2 rounded border border-border p-3"
    >
      <input type="hidden" name="id" value={investment.id} />
      <input type="hidden" name="type" value="renda_fixa" />
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
        <label className="text-xs text-fg/70">Valor investido</label>
        <input
          name="invested_amount"
          type="number"
          step="0.01"
          defaultValue={investment.invested_amount}
          className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
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
        <label className="text-xs text-fg/70">Taxa</label>
        <input
          name="rate"
          defaultValue={investment.rate ?? ''}
          placeholder="110% CDI"
          className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Indexador</label>
        <select
          name="index_type"
          defaultValue={investment.index_type ?? ''}
          className="rounded border border-border bg-bg px-2 py-1 text-sm"
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
        <label className="text-xs text-fg/70">Liquidez</label>
        <input
          name="liquidity"
          defaultValue={investment.liquidity ?? ''}
          placeholder="Diária, D+30..."
          className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Carência</label>
        <input
          name="grace_period"
          defaultValue={investment.grace_period ?? ''}
          className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Data de aplicação</label>
        <input
          name="applied_at"
          type="date"
          defaultValue={investment.applied_at ?? ''}
          className="rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Vencimento</label>
        <input
          name="maturity_at"
          type="date"
          defaultValue={investment.maturity_at ?? ''}
          className="rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Rentabilidade</label>
        <p
          className={
            'w-28 rounded px-2 py-1 text-sm tabular-nums ' +
            (rentabilidade < 0 ? 'text-negative' : 'text-positive')
          }
        >
          {formatBRL(rentabilidade)}
        </p>
      </div>
      <button
        type="submit"
        className="rounded border border-border px-3 py-1 text-sm hover:bg-muted"
      >
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
      <input type="hidden" name="type" value="renda_fixa" />
      <div className="min-w-[8rem] flex-1 space-y-1">
        <label className="text-xs text-fg/70">Descrição</label>
        <input
          name="description"
          placeholder="Ex: CDB Banco X"
          required
          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Instituição</label>
        <input name="institution" className="w-32 rounded border border-border bg-bg px-2 py-1 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Valor investido</label>
        <input
          name="invested_amount"
          type="number"
          step="0.01"
          required
          className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
        />
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
        <label className="text-xs text-fg/70">Taxa</label>
        <input name="rate" placeholder="110% CDI" className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Indexador</label>
        <select name="index_type" defaultValue="" className="rounded border border-border bg-bg px-2 py-1 text-sm">
          <option value="">—</option>
          {INDEX_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Liquidez</label>
        <input name="liquidity" placeholder="Diária, D+30..." className="w-28 rounded border border-border bg-bg px-2 py-1 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Carência</label>
        <input name="grace_period" className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Data de aplicação</label>
        <input name="applied_at" type="date" className="rounded border border-border bg-bg px-2 py-1 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Vencimento</label>
        <input name="maturity_at" type="date" className="rounded border border-border bg-bg px-2 py-1 text-sm" />
      </div>
      <button type="submit" className="rounded bg-accent px-3 py-1 text-sm text-accent-foreground">
        Adicionar
      </button>
    </form>
  );
}

export function RendaFixa({ investments }: { investments: Investment[] }) {
  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Renda Fixa</h2>
      <div className="mt-4 space-y-2">
        {investments.map((inv) => (
          <Row key={inv.id} investment={inv} />
        ))}
        <NewRow />
      </div>
    </section>
  );
}
