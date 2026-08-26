import type { Debt, DebtWithoutSchedule, MonthKey } from '@/lib/ledger/types';
import { totalCommittedByPaymentMethod } from '@/lib/ledger/debts';
import { formatBRL } from '@/lib/format';

export function EndividamentoTotal({
  debts,
  debtsWithoutSchedule,
  monthsAxis,
  currentMonth,
}: {
  debts: Debt[];
  debtsWithoutSchedule: DebtWithoutSchedule[];
  monthsAxis: MonthKey[];
  currentMonth: MonthKey;
}) {
  const committed = totalCommittedByPaymentMethod(debts, monthsAxis, currentMonth);
  const comCronograma = Object.values(committed).reduce((sum, v) => sum + v, 0);
  const semCronograma = debtsWithoutSchedule.reduce((sum, d) => sum + d.open_balance, 0);
  const total = comCronograma + semCronograma;

  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Endividamento total</h2>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-negative">{formatBRL(total)}</p>
      <dl className="mt-3 flex gap-6 text-sm tabular-nums text-fg/70">
        <div className="flex gap-1">
          <dt>Com cronograma:</dt>
          <dd>{formatBRL(comCronograma)}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Sem cronograma:</dt>
          <dd>{formatBRL(semCronograma)}</dd>
        </div>
      </dl>
    </section>
  );
}
