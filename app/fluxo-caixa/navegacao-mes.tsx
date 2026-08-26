import Link from 'next/link';
import type { MonthKey } from '@/lib/ledger/types';

export function NavegacaoMes({
  monthsAxis,
  selectedIndex,
}: {
  monthsAxis: MonthKey[];
  selectedIndex: number;
}) {
  const prevIndex = selectedIndex - 1;
  const nextIndex = selectedIndex + 1;
  const hasPrev = prevIndex >= 0;
  const hasNext = nextIndex < monthsAxis.length;

  return (
    <div className="flex items-center justify-between rounded border border-border p-3">
      {hasPrev ? (
        <Link
          href={`/fluxo-caixa?mes=${prevIndex}`}
          className="rounded border border-border px-3 py-1 text-sm hover:bg-muted"
        >
          ‹ Mês anterior
        </Link>
      ) : (
        <span className="rounded border border-border px-3 py-1 text-sm opacity-40">
          ‹ Mês anterior
        </span>
      )}
      <span className="text-lg font-semibold">{monthsAxis[selectedIndex].label}</span>
      {hasNext ? (
        <Link
          href={`/fluxo-caixa?mes=${nextIndex}`}
          className="rounded border border-border px-3 py-1 text-sm hover:bg-muted"
        >
          Mês seguinte ›
        </Link>
      ) : (
        <span className="rounded border border-border px-3 py-1 text-sm opacity-40">
          Mês seguinte ›
        </span>
      )}
    </div>
  );
}
