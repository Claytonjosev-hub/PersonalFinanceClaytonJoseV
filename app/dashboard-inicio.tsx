import type { UpcomingItem } from '@/lib/ledger/projection';
import { formatBRL } from '@/lib/format';

const SHORT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function formatShortDate(iso: string): string {
  const [, month, day] = iso.split('-').map(Number);
  return `${day} ${SHORT_MONTHS[month - 1]}`;
}

function UpcomingList({
  title,
  items,
  tone,
  emptyMessage,
}: {
  title: string;
  items: UpcomingItem[];
  tone: 'positive' | 'negative';
  emptyMessage: string;
}) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <span
          className={
            'shrink-0 rounded-full px-2.5 py-1 text-sm font-medium tabular-nums ' +
            (tone === 'positive' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative')
          }
        >
          {formatBRL(total)}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-fg/60">{emptyMessage}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item, i) => (
            <li
              key={`${item.date}-${i}`}
              className="flex items-center justify-between gap-3 border-b border-border-subtle pb-2 text-sm last:border-b-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate">{item.description}</p>
                <p className="text-xs text-fg/50">{formatShortDate(item.date)}</p>
              </div>
              <span className="shrink-0 tabular-nums">{formatBRL(item.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DashboardInicio({
  saldoAtual,
  disponivel,
  proximoSalarioIso,
  horizonDays,
  totalDividas,
  upcomingReceitas,
  upcomingDespesas,
}: {
  saldoAtual: number;
  disponivel: number;
  proximoSalarioIso: string | null;
  horizonDays: number;
  totalDividas: number;
  upcomingReceitas: UpcomingItem[];
  upcomingDespesas: UpcomingItem[];
}) {
  const disponivelLabel = proximoSalarioIso
    ? `Menor saldo projetado até o próximo salário, em ${formatShortDate(proximoSalarioIso)}`
    : `Menor saldo projetado nos próximos ${horizonDays} dias`;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
          <h3 className="text-xs font-medium uppercase tracking-wide text-fg/60">Saldo atual</h3>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">
            {formatBRL(saldoAtual)}
          </p>
        </div>

        <div
          className={
            'rounded-xl border p-6 shadow-soft ' +
            (disponivel < 0 ? 'border-negative/20 bg-negative/5' : 'border-accent/20 bg-accent-muted/50')
          }
        >
          <h3 className="text-xs font-medium uppercase tracking-wide text-fg/60">
            Disponível para gastar
          </h3>
          <p
            className={
              'mt-1.5 text-3xl font-semibold tracking-tight tabular-nums ' +
              (disponivel < 0 ? 'text-negative' : '')
            }
          >
            {formatBRL(disponivel)}
          </p>
          <p className="mt-1 text-xs text-fg/60">{disponivelLabel}</p>
        </div>

        <div className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
          <h3 className="text-xs font-medium uppercase tracking-wide text-fg/60">
            Total em dívidas em aberto
          </h3>
          <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-negative">
            {formatBRL(totalDividas)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UpcomingList
          title={`Recebimentos (${horizonDays} dias)`}
          items={upcomingReceitas}
          tone="positive"
          emptyMessage="Nenhum recebimento previsto nesse período."
        />
        <UpcomingList
          title={`Pagamentos (${horizonDays} dias)`}
          items={upcomingDespesas}
          tone="negative"
          emptyMessage="Nenhum pagamento previsto nesse período."
        />
      </div>
    </div>
  );
}
