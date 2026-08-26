import type { Indicadores, MonthlyDespesas, MonthlyReceitas } from '@/lib/ledger/projection';
import type { MonthKey } from '@/lib/ledger/types';
import { formatBRL } from '@/lib/format';

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function ResultadoIndicadores({
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
  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Resultado do mês</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 border-b border-border bg-bg p-2 text-left"></th>
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
            <tr>
              <td className="sticky left-0 border-b border-border bg-bg p-2 font-medium">
                Resultado do mês
              </td>
              {monthsAxis.map((m, i) => {
                const resultado = monthlyReceitas[i].total - monthlyDespesas[i].total;
                return (
                  <td
                    key={`${m.year}-${m.month}`}
                    className={
                      'border-b border-border p-2 text-right tabular-nums ' +
                      (resultado < 0 ? 'text-negative' : 'text-positive')
                    }
                  >
                    {formatBRL(resultado)}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="sticky left-0 border-b border-border bg-bg p-2 font-medium">
                Saldo acumulado
              </td>
              {monthsAxis.map((m, i) => (
                <td
                  key={`${m.year}-${m.month}`}
                  className={
                    'border-b border-border p-2 text-right tabular-nums ' +
                    (saldoAcumulado[i] < 0 ? 'text-negative' : 'text-fg')
                  }
                >
                  {formatBRL(saldoAcumulado[i])}
                </td>
              ))}
            </tr>
            <tr>
              <td className="sticky left-0 border-b border-border bg-bg p-2 font-medium">
                Status
              </td>
              {monthsAxis.map((m, i) => (
                <td
                  key={`${m.year}-${m.month}`}
                  className={
                    'border-b border-border p-2 text-right font-medium ' +
                    (indicadores[i].status === 'deficit' ? 'text-negative' : 'text-positive')
                  }
                >
                  {indicadores[i].status === 'deficit' ? 'DÉFICIT' : 'OK'}
                </td>
              ))}
            </tr>
            <tr className="text-fg/70">
              <td className="sticky left-0 border-b border-border bg-bg p-2">
                % renda comprometida (dívidas)
              </td>
              {monthsAxis.map((m, i) => (
                <td
                  key={`${m.year}-${m.month}`}
                  className="border-b border-border p-2 text-right tabular-nums"
                >
                  {formatPercent(indicadores[i].percentRendaComprometida)}
                </td>
              ))}
            </tr>
            <tr className="text-fg/70">
              <td className="sticky left-0 border-b border-border bg-bg p-2">% renda gasta</td>
              {monthsAxis.map((m, i) => (
                <td
                  key={`${m.year}-${m.month}`}
                  className="border-b border-border p-2 text-right tabular-nums"
                >
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
