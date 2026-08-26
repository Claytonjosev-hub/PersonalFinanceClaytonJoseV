import Link from 'next/link';
import type { MonthKey } from '@/lib/ledger/types';

export function NavegacaoMes({
  monthsAxis,
  leftIndex,
  rightIndex,
}: {
  monthsAxis: MonthKey[];
  leftIndex: number;
  rightIndex: number | null;
}) {
  const prevIndex = leftIndex - 2;
  const nextIndex = leftIndex + 2;
  const hasPrev = prevIndex >= 0;
  const hasNext = nextIndex < monthsAxis.length;

  const rangeLabel =
    rightIndex != null
      ? `${monthsAxis[leftIndex].label} – ${monthsAxis[rightIndex].label}`
      : monthsAxis[leftIndex].label;

  return (
    <div className="flex items-center justify-between rounded border border-border p-3">
      {hasPrev ? (
        <Link
          href={`/fluxo-caixa?mes=${prevIndex}`}
          className="rounded border border-border px-3 py-1 text-sm hover:bg-muted"
        >
          ‹ Meses anteriores
        </Link>
      ) : (
        <span className="rounded border border-border px-3 py-1 text-sm opacity-40">
          ‹ Meses anteriores
        </span>
      )}
      <span className="text-lg font-semibold">{rangeLabel}</span>
      {hasNext ? (
        <Link
          href={`/fluxo-caixa?mes=${nextIndex}`}
          className="rounded border border-border px-3 py-1 text-sm hover:bg-muted"
        >
          Meses seguintes ›
        </Link>
      ) : (
        <span className="rounded border border-border px-3 py-1 text-sm opacity-40">
          Meses seguintes ›
        </span>
      )}
    </div>
  );
}
