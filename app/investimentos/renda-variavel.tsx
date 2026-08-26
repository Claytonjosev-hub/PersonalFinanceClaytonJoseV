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
      className="flex flex-wrap items-end gap-2 rounded border border-border p-3"
    >
      <input type="hidden" name="id" value={investment.id} />
      <input type="hidden" name="type" value="renda_variavel" />
      <div className="min-w-[6rem] space-y-1">
        <label className="text-xs text-fg/70">Ticker / Descrição</label>
        <input
          name="description"
          defaultValue={investment.description}
          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Instituição/corretora</label>
        <input
          name="institution"
          defaultValue={investment.institution ?? ''}
          className="w-32 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Quantidade</label>
        <input
          name="quantity"
          type="number"
          step="0.000001"
          defaultValue={investment.quantity ?? ''}
          className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Preço médio</label>
        <input
          name="average_price"
          type="number"
          step="0.01"
          defaultValue={investment.average_price ?? ''}
          className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
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
        <label className="text-xs text-fg/70">Rentabilidade</label>
        <p
          className={
            'w-28 rounded px-2 py-1 text-sm tabular-nums ' +
            (rent == null ? 'text-fg/50' : rent < 0 ? 'text-negative' : 'text-positive')
          }
        >
          {rent == null ? '—' : formatBRL(rent)}
        </p>
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
      <input type="hidden" name="type" value="renda_variavel" />
      <div className="min-w-[6rem] space-y-1">
        <label className="text-xs text-fg/70">Ticker / Descrição</label>
        <input
          name="description"
          placeholder="Ex: PETR4"
          required
          className="w-full rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Instituição/corretora</label>
        <input name="institution" className="w-32 rounded border border-border bg-bg px-2 py-1 text-sm" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Quantidade</label>
        <input
          name="quantity"
          type="number"
          step="0.000001"
          required
          className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-fg/70">Preço médio</label>
        <input
          name="average_price"
          type="number"
          step="0.01"
          required
          className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
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
      <button type="submit" className="rounded bg-accent px-3 py-1 text-sm text-accent-foreground">
        Adicionar
      </button>
    </form>
  );
}

export function RendaVariavel({ investments }: { investments: Investment[] }) {
  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Renda Variável</h2>
      <div className="mt-4 space-y-2">
        {investments.map((inv) => (
          <Row key={inv.id} investment={inv} />
        ))}
        <NewRow />
      </div>
    </section>
  );
}
