import { Fragment } from 'react';
import type { DailyEntry } from '@/lib/ledger/projection';
import type { MonthKey } from '@/lib/ledger/types';
import { formatBRL } from '@/lib/format';
import { CelulaLancamento } from './celula-lancamento';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDate(month: MonthKey, day: number): string {
  return `${month.year}-${pad(month.month)}-${pad(day)}`;
}

export function TabelaFluxo({
  monthsAxis,
  entriesByMonth,
  resultados,
  todayIso,
}: {
  monthsAxis: MonthKey[];
  entriesByMonth: DailyEntry[][];
  resultados: number[];
  todayIso: string;
}) {
  const maxDays = Math.max(...entriesByMonth.map((entries) => entries.length));

  const totalsByMonth = entriesByMonth.map((entries) =>
    entries.reduce(
      (acc, e) => ({
        receitas: acc.receitas + e.receitasAutomaticas + e.receitasManuais,
        despesas: acc.despesas + e.despesasAutomaticas + e.despesasManuais,
      }),
      { receitas: 0, despesas: 0 }
    )
  );

  return (
    <section className="rounded border border-border p-4">
      <p className="mb-3 text-xs text-fg/70">
        Role para o lado para ver os outros meses — como em uma planilha. Clique em um valor de
        Receita ou Despesa para lançar um teste direto naquele dia.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th
                rowSpan={2}
                className="sticky left-0 z-10 border-b border-r border-border bg-bg p-2 text-left align-bottom"
              >
                Dia
              </th>
              {monthsAxis.map((m) => (
                <th
                  key={`${m.year}-${m.month}`}
                  colSpan={4}
                  className="border-b border-l border-border bg-muted p-2 text-center font-semibold"
                >
                  {m.label}
                </th>
              ))}
            </tr>
            <tr>
              {monthsAxis.map((m) => (
                <Fragment key={`${m.year}-${m.month}`}>
                  <th
                    key={`${m.year}-${m.month}-receitas`}
                    className="border-b border-l border-border p-2 text-right font-normal text-fg/70"
                  >
                    Receitas
                  </th>
                  <th
                    key={`${m.year}-${m.month}-despesas`}
                    className="border-b border-border p-2 text-right font-normal text-fg/70"
                  >
                    Despesas
                  </th>
                  <th
                    key={`${m.year}-${m.month}-diario`}
                    className="border-b border-border p-2 text-right font-normal text-fg/70"
                  >
                    Diário
                  </th>
                  <th
                    key={`${m.year}-${m.month}-saldo`}
                    className="border-b border-border p-2 text-right font-normal text-fg/70"
                  >
                    Saldo
                  </th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxDays }, (_, i) => i + 1).map((day) => (
              <tr key={day}>
                <td className="sticky left-0 z-10 border-r border-border bg-bg p-2 tabular-nums">
                  {day}
                </td>
                {monthsAxis.map((m, monthIndex) => {
                  const entry = entriesByMonth[monthIndex][day - 1];
                  if (!entry) {
                    return (
                      <td
                        key={`${m.year}-${m.month}-${day}`}
                        colSpan={4}
                        className="border-l border-border bg-muted/40 p-2"
                      />
                    );
                  }
                  const date = isoDate(m, day);
                  const isToday = date === todayIso;
                  const receitasDoDia = entry.receitasAutomaticas + entry.receitasManuais;
                  const despesasDoDia = entry.despesasAutomaticas + entry.despesasManuais;
                  const diario = receitasDoDia - despesasDoDia;
                  return (
                    <Fragment key={`${m.year}-${m.month}-${day}`}>
                      <td
                        key={`${m.year}-${m.month}-${day}-r`}
                        className={
                          'border-l border-border p-1 ' + (isToday ? 'bg-accent/10' : '')
                        }
                      >
                        <CelulaLancamento date={date} type="receita" amount={receitasDoDia} />
                      </td>
                      <td
                        key={`${m.year}-${m.month}-${day}-d`}
                        className={'p-1 ' + (isToday ? 'bg-accent/10' : '')}
                      >
                        <CelulaLancamento date={date} type="despesa" amount={despesasDoDia} />
                      </td>
                      <td
                        key={`${m.year}-${m.month}-${day}-diario`}
                        className={
                          'p-2 text-right tabular-nums ' +
                          (isToday ? 'bg-accent/10 ' : '') +
                          (diario < 0 ? 'text-negative' : diario > 0 ? 'text-positive' : '')
                        }
                      >
                        {diario === 0 ? '—' : formatBRL(diario)}
                      </td>
                      <td
                        key={`${m.year}-${m.month}-${day}-saldo`}
                        className={
                          'p-2 text-right font-medium tabular-nums ' +
                          (isToday ? 'bg-accent/10 ' : '') +
                          (entry.saldo < 0 ? 'text-negative' : 'text-fg')
                        }
                      >
                        {formatBRL(entry.saldo)}
                      </td>
                    </Fragment>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="sticky left-0 z-10 border-r border-t border-border bg-bg p-2">
                Total
              </td>
              {monthsAxis.map((m, i) => (
                <Fragment key={`${m.year}-${m.month}-total`}>
                  <td
                    key={`${m.year}-${m.month}-total-r`}
                    className="border-l border-t border-border p-2 text-right tabular-nums"
                  >
                    {formatBRL(totalsByMonth[i].receitas)}
                  </td>
                  <td
                    key={`${m.year}-${m.month}-total-d`}
                    className="border-t border-border p-2 text-right tabular-nums"
                  >
                    {formatBRL(totalsByMonth[i].despesas)}
                  </td>
                  <td colSpan={2} className="border-t border-border p-2 text-right tabular-nums">
                    Resultado: {formatBRL(resultados[i])}
                  </td>
                </Fragment>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
