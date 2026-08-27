import type { Investment } from '@/lib/data/investments';
import { formatBRL } from '@/lib/format';

const TYPE_LABELS: Record<string, string> = {
  renda_fixa: 'Renda Fixa',
  renda_variavel: 'Renda Variável',
  reserva_emergencia: 'Reserva de Emergência',
};

function investedAmountFor(inv: Investment): number {
  if (inv.type === 'renda_variavel' && inv.quantity != null && inv.average_price != null) {
    return inv.quantity * inv.average_price;
  }
  return inv.invested_amount;
}

function Card({
  label,
  invested,
  current,
  emphasis = false,
}: {
  label: string;
  invested: number;
  current: number;
  emphasis?: boolean;
}) {
  const rentabilidade = current - invested;
  return (
    <div
      className={
        'rounded-lg p-4 ' +
        (emphasis ? 'border border-accent/20 bg-accent-muted/50' : 'border border-border-subtle bg-bg/40')
      }
    >
      <h3 className="text-xs font-medium uppercase tracking-wide text-fg/60">{label}</h3>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums">
        {formatBRL(current)}
      </p>
      <dl className="mt-3 space-y-1 text-xs tabular-nums text-fg/60">
        <div className="flex justify-between">
          <dt>Investido</dt>
          <dd>{formatBRL(invested)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Rentabilidade</dt>
          <dd className={rentabilidade < 0 ? 'text-negative' : 'text-positive'}>
            {formatBRL(rentabilidade)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function Resumo({ investments }: { investments: Investment[] }) {
  const totalInvested = investments.reduce((sum, i) => sum + investedAmountFor(i), 0);
  const totalCurrent = investments.reduce((sum, i) => sum + i.current_amount, 0);

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">Resumo</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Total geral" invested={totalInvested} current={totalCurrent} emphasis />
        {(['renda_fixa', 'renda_variavel', 'reserva_emergencia'] as const).map((type) => {
          const ofType = investments.filter((i) => i.type === type);
          return (
            <Card
              key={type}
              label={TYPE_LABELS[type]}
              invested={ofType.reduce((sum, i) => sum + investedAmountFor(i), 0)}
              current={ofType.reduce((sum, i) => sum + i.current_amount, 0)}
            />
          );
        })}
      </div>
    </section>
  );
}
