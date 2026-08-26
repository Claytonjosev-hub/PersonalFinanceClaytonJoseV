'use client';

import { Fragment, useEffect, useState } from 'react';
import type { MonthlyDespesas } from '@/lib/ledger/projection';
import type { MonthKey } from '@/lib/ledger/types';
import { formatBRL } from '@/lib/format';

export function Despesas({
  monthsAxis,
  monthlyDespesas,
}: {
  monthsAxis: MonthKey[];
  monthlyDespesas: MonthlyDespesas[];
}) {
  // Union of every payment method (by id, or its display name when the id
  // is null/"sem forma de pagamento") across all months.
  const pmKeys = new Map<string, string>();
  for (const month of monthlyDespesas) {
    for (const pm of month.byPaymentMethod) {
      pmKeys.set(pm.paymentMethodId ?? pm.paymentMethodName, pm.paymentMethodName);
    }
  }

  // Cards start expanded — the whole point of this view (per the old
  // spreadsheet layout) is seeing each card's breakdown immediately, not
  // hunting for a toggle. Collapsing is still available per-row.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(pmKeys.keys()));

  // Keep newly-appearing payment methods (e.g. a card just added in
  // Parâmetros) expanded by default too, not just the ones present on mount.
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const key of pmKeys.keys()) {
        if (!next.has(key)) {
          next.add(key);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyDespesas]);

  function pmFor(monthIndex: number, key: string) {
    return monthlyDespesas[monthIndex].byPaymentMethod.find(
      (pm) => (pm.paymentMethodId ?? pm.paymentMethodName) === key
    );
  }

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Union of categories under a payment method, across all months, for the
  // expanded sub-rows.
  function categoryLabelsFor(key: string): Map<string, string> {
    const labels = new Map<string, string>();
    for (let i = 0; i < monthsAxis.length; i++) {
      const pm = pmFor(i, key);
      if (!pm) continue;
      for (const cat of pm.byCategory) {
        labels.set(cat.categoryId ?? cat.categoryName, cat.categoryName);
      }
    }
    return labels;
  }

  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Despesas</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 border-b border-border bg-bg p-2 text-left">
                Forma de pagamento
              </th>
              {monthsAxis.map((m) => (
                <th
                  key={`${m.year}-${m.month}`}
                  className="border-b border-border p-2 text-right font-medium"
                >
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(pmKeys.entries()).map(([key, label]) => {
              const isExpanded = expanded.has(key);
              const categoryLabels = categoryLabelsFor(key);
              return (
                <Fragment key={key}>
                  <tr key={key}>
                    <td className="sticky left-0 border-b border-border bg-bg p-2 font-medium">
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className="flex items-center gap-1 hover:underline"
                      >
                        <span>{isExpanded ? '▾' : '▸'}</span>
                        {label}
                      </button>
                    </td>
                    {monthsAxis.map((m, i) => (
                      <td
                        key={`${m.year}-${m.month}`}
                        className="border-b border-border p-2 text-right tabular-nums"
                      >
                        {formatBRL(pmFor(i, key)?.total ?? 0)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded &&
                    Array.from(categoryLabels.entries()).map(([catKey, catLabel]) => (
                      <tr key={`${key}-${catKey}`} className="text-fg/70">
                        <td className="sticky left-0 border-b border-border bg-bg p-2 pl-8">
                          {catLabel}
                        </td>
                        {monthsAxis.map((m, i) => {
                          const amount =
                            pmFor(i, key)?.byCategory.find(
                              (c) => (c.categoryId ?? c.categoryName) === catKey
                            )?.amount ?? 0;
                          return (
                            <td
                              key={`${m.year}-${m.month}`}
                              className="border-b border-border p-2 text-right tabular-nums"
                            >
                              {amount === 0 ? '—' : formatBRL(amount)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </Fragment>
              );
            })}
            <tr className="font-semibold">
              <td className="sticky left-0 border-b border-border bg-bg p-2">
                Total de despesas
              </td>
              {monthsAxis.map((m, i) => (
                <td
                  key={`${m.year}-${m.month}`}
                  className="border-b border-border p-2 text-right tabular-nums text-negative"
                >
                  {formatBRL(monthlyDespesas[i].total)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
