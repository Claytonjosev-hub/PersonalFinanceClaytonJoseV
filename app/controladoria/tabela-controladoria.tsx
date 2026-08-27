'use client';

import { Fragment, useEffect, useState } from 'react';
import type {
  CategoryTotal,
  Indicadores,
  MonthlyDespesas,
  MonthlyReceitas,
} from '@/lib/ledger/projection';
import type { MonthKey } from '@/lib/ledger/types';
import { formatBRL } from '@/lib/format';

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// One continuous sheet — receitas first, despesas by card/categoria second,
// resultado last — matching the shape of the original spreadsheet's
// Controladoria tab (entrada primeiro, saída em categorias depois).
export function TabelaControladoria({
  monthsAxis,
  monthlyReceitas,
  monthlyDespesas,
  saldoAcumulado,
  indicadores,
}: {
  monthsAxis: MonthKey[];
  monthlyReceitas: MonthlyReceitas[];
  monthlyDespesas: MonthlyDespesas[];
  saldoAcumulado: number[];
  indicadores: Indicadores[];
}) {
  // --- Receitas: union of every income category across all months -------
  const receitaLabels = new Map<string, string>();
  for (const month of monthlyReceitas) {
    for (const row of month.byCategory) {
      receitaLabels.set(row.categoryId ?? row.categoryName, row.categoryName);
    }
  }
  function receitaAmount(monthIndex: number, key: string): number {
    return (
      monthlyReceitas[monthIndex].byCategory.find(
        (r: CategoryTotal) => (r.categoryId ?? r.categoryName) === key
      )?.amount ?? 0
    );
  }

  // --- Despesas: union of every payment method (card) across all months -
  const pmKeys = new Map<string, string>();
  for (const month of monthlyDespesas) {
    for (const pm of month.byPaymentMethod) {
      pmKeys.set(pm.paymentMethodId ?? pm.paymentMethodName, pm.paymentMethodName);
    }
  }
  function pmFor(monthIndex: number, key: string) {
    return monthlyDespesas[monthIndex].byPaymentMethod.find(
      (pm) => (pm.paymentMethodId ?? pm.paymentMethodName) === key
    );
  }
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

  // Cards start expanded, same as before — clicking a card's row collapses it.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(pmKeys.keys()));
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

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const cell = 'border-b border-border-subtle px-3 py-2 text-right tabular-nums';
  const sticky = 'sticky left-0 z-10 border-b border-border-subtle bg-surface px-3 py-2';
  const headCell =
    'sticky top-0 z-20 border-b border-border-subtle bg-muted/70 px-3 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-fg/60';
  const headSticky =
    'sticky left-0 top-0 z-30 border-b border-border-subtle bg-muted/70 px-3 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-fg/60';
  const groupRow = 'bg-muted/60 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-fg/80';

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-4 shadow-soft sm:p-6">
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className={headSticky}>Categoria</th>
              {monthsAxis.map((m) => (
                <th key={`${m.year}-${m.month}`} className={headCell}>
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Receitas ---------------------------------------------------- */}
            <tr>
              <td colSpan={monthsAxis.length + 1} className={groupRow}>
                Receitas
              </td>
            </tr>
            {Array.from(receitaLabels.entries()).map(([key, label]) => (
              <tr key={key}>
                <td className={sticky}>{label}</td>
                {monthsAxis.map((m, i) => {
                  const amount = receitaAmount(i, key);
                  return (
                    <td key={`${m.year}-${m.month}`} className={cell}>
                      {amount === 0 ? '—' : formatBRL(amount)}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="font-semibold">
              <td className={sticky}>Total de receitas</td>
              {monthsAxis.map((m, i) => (
                <td key={`${m.year}-${m.month}`} className={cell + ' text-positive'}>
                  {formatBRL(monthlyReceitas[i].total)}
                </td>
              ))}
            </tr>

            {/* Despesas ---------------------------------------------------- */}
            <tr>
              <td colSpan={monthsAxis.length + 1} className={groupRow}>
                Despesas
              </td>
            </tr>
            {Array.from(pmKeys.entries()).map(([key, label]) => {
              const isExpanded = expanded.has(key);
              const categoryLabels = categoryLabelsFor(key);
              return (
                <Fragment key={key}>
                  <tr>
                    <td className={sticky + ' font-medium'}>
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
                      <td key={`${m.year}-${m.month}`} className={cell}>
                        {formatBRL(pmFor(i, key)?.total ?? 0)}
                      </td>
                    ))}
                  </tr>
                  {isExpanded &&
                    Array.from(categoryLabels.entries()).map(([catKey, catLabel]) => (
                      <tr key={`${key}-${catKey}`} className="text-fg/70">
                        <td className={sticky + ' pl-8'}>{catLabel}</td>
                        {monthsAxis.map((m, i) => {
                          const amount =
                            pmFor(i, key)?.byCategory.find(
                              (c) => (c.categoryId ?? c.categoryName) === catKey
                            )?.amount ?? 0;
                          return (
                            <td key={`${m.year}-${m.month}`} className={cell}>
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
              <td className={sticky}>Total de despesas</td>
              {monthsAxis.map((m, i) => (
                <td key={`${m.year}-${m.month}`} className={cell + ' text-negative'}>
                  {formatBRL(monthlyDespesas[i].total)}
                </td>
              ))}
            </tr>

            {/* Resultado ----------------------------------------------------- */}
            <tr className="bg-muted/60 font-semibold">
              <td className={sticky + ' bg-muted/60'}>Resultado do mês</td>
              {monthsAxis.map((m, i) => {
                const resultado = monthlyReceitas[i].total - monthlyDespesas[i].total;
                return (
                  <td
                    key={`${m.year}-${m.month}`}
                    className={
                      cell + ' bg-muted/60 ' + (resultado < 0 ? 'text-negative' : 'text-positive')
                    }
                  >
                    {formatBRL(resultado)}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className={sticky}>Saldo acumulado</td>
              {monthsAxis.map((m, i) => (
                <td
                  key={`${m.year}-${m.month}`}
                  className={cell + ' ' + (saldoAcumulado[i] < 0 ? 'text-negative' : '')}
                >
                  {formatBRL(saldoAcumulado[i])}
                </td>
              ))}
            </tr>
            <tr>
              <td className={sticky}>Status</td>
              {monthsAxis.map((m, i) => (
                <td key={`${m.year}-${m.month}`} className={cell}>
                  <span
                    className={
                      'inline-block rounded-full px-2 py-0.5 text-xs font-medium ' +
                      (indicadores[i].status === 'deficit'
                        ? 'bg-negative/10 text-negative'
                        : 'bg-positive/10 text-positive')
                    }
                  >
                    {indicadores[i].status === 'deficit' ? 'DÉFICIT' : 'OK'}
                  </span>
                </td>
              ))}
            </tr>
            <tr className="text-fg/70">
              <td className={sticky}>% renda comprometida (dívidas)</td>
              {monthsAxis.map((m, i) => (
                <td key={`${m.year}-${m.month}`} className={cell}>
                  {formatPercent(indicadores[i].percentRendaComprometida)}
                </td>
              ))}
            </tr>
            <tr className="text-fg/70">
              <td className={sticky}>% renda gasta</td>
              {monthsAxis.map((m, i) => (
                <td key={`${m.year}-${m.month}`} className={cell}>
                  {formatPercent(indicadores[i].percentRendaGasta)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
