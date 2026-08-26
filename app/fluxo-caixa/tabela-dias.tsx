import type { DailyEntry } from '@/lib/ledger/projection';
import { formatBRL } from '@/lib/format';

export function TabelaDias({
  entries,
  resultadoDoMes,
}: {
  entries: DailyEntry[];
  resultadoDoMes: number;
}) {
  const totals = entries.reduce(
    (acc, e) => ({
      receitasAutomaticas: acc.receitasAutomaticas + e.receitasAutomaticas,
      receitasManuais: acc.receitasManuais + e.receitasManuais,
      despesasAutomaticas: acc.despesasAutomaticas + e.despesasAutomaticas,
      despesasManuais: acc.despesasManuais + e.despesasManuais,
    }),
    { receitasAutomaticas: 0, receitasManuais: 0, despesasAutomaticas: 0, despesasManuais: 0 }
  );

  return (
    <section className="rounded border border-border p-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 border-b border-border bg-bg p-2 text-left">Dia</th>
              <th className="border-b border-border p-2 text-right">Receitas automáticas</th>
              <th className="border-b border-border p-2 text-right">Receitas manuais</th>
              <th className="border-b border-border p-2 text-right">Despesas automáticas</th>
              <th className="border-b border-border p-2 text-right">Despesas manuais</th>
              <th className="border-b border-border p-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.day}>
                <td className="sticky left-0 border-b border-border bg-bg p-2 tabular-nums">
                  {e.day}
                </td>
                <td className="border-b border-border p-2 text-right tabular-nums">
                  {e.receitasAutomaticas === 0 ? '—' : formatBRL(e.receitasAutomaticas)}
                </td>
                <td className="border-b border-border p-2 text-right tabular-nums">
                  {e.receitasManuais === 0 ? '—' : formatBRL(e.receitasManuais)}
                </td>
                <td className="border-b border-border p-2 text-right tabular-nums">
                  {e.despesasAutomaticas === 0 ? '—' : formatBRL(e.despesasAutomaticas)}
                </td>
                <td className="border-b border-border p-2 text-right tabular-nums">
                  {e.despesasManuais === 0 ? '—' : formatBRL(e.despesasManuais)}
                </td>
                <td
                  className={
                    'border-b border-border p-2 text-right tabular-nums font-medium ' +
                    (e.saldo < 0 ? 'text-negative' : 'text-fg')
                  }
                >
                  {formatBRL(e.saldo)}
                </td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="sticky left-0 border-b border-border bg-bg p-2">Total do mês</td>
              <td className="border-b border-border p-2 text-right tabular-nums">
                {formatBRL(totals.receitasAutomaticas)}
              </td>
              <td className="border-b border-border p-2 text-right tabular-nums">
                {formatBRL(totals.receitasManuais)}
              </td>
              <td className="border-b border-border p-2 text-right tabular-nums">
                {formatBRL(totals.despesasAutomaticas)}
              </td>
              <td className="border-b border-border p-2 text-right tabular-nums">
                {formatBRL(totals.despesasManuais)}
              </td>
              <td className="border-b border-border p-2 text-right"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-fg/70">
        Resultado do mês:{' '}
        <span
          className={
            'font-medium tabular-nums ' + (resultadoDoMes < 0 ? 'text-negative' : 'text-positive')
          }
        >
          {formatBRL(resultadoDoMes)}
        </span>{' '}
        — deve ser idêntico ao valor mostrado na Controladoria para este mês, por construção.
      </p>
    </section>
  );
}
