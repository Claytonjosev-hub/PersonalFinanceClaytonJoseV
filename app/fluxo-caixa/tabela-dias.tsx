import type { DailyEntry } from '@/lib/ledger/projection';
import type { MonthKey } from '@/lib/ledger/types';
import { formatBRL } from '@/lib/format';

export function TabelaDias({
  month,
  entries,
  resultadoDoMes,
}: {
  month: MonthKey;
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
    <section className="min-w-0 flex-1 rounded border border-border p-4">
      <h2 className="mb-3 text-center text-lg font-semibold">{month.label}</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 border-b border-border bg-bg p-2 text-left">Dia</th>
              <th className="border-b border-border p-2 text-right">Receitas</th>
              <th className="border-b border-border p-2 text-right">Despesas</th>
              <th className="border-b border-border p-2 text-right">Diário</th>
              <th className="border-b border-border p-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const receitasDoDia = e.receitasAutomaticas + e.receitasManuais;
              const despesasDoDia = e.despesasAutomaticas + e.despesasManuais;
              const netDoDia = receitasDoDia - despesasDoDia;
              return (
                <tr key={e.day}>
                  <td className="sticky left-0 border-b border-border bg-bg p-2 tabular-nums">
                    {e.day}
                  </td>
                  <td className="border-b border-border p-2 text-right tabular-nums">
                    {receitasDoDia === 0 ? '—' : formatBRL(receitasDoDia)}
                  </td>
                  <td className="border-b border-border p-2 text-right tabular-nums">
                    {despesasDoDia === 0 ? '—' : formatBRL(despesasDoDia)}
                  </td>
                  <td
                    className={
                      'border-b border-border p-2 text-right tabular-nums ' +
                      (netDoDia < 0 ? 'text-negative' : 'text-positive')
                    }
                  >
                    {netDoDia === 0 ? '—' : formatBRL(netDoDia)}
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
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-semibold">
              <td className="sticky left-0 border-t border-border bg-bg p-2">Total</td>
              <td className="border-t border-border p-2 text-right tabular-nums">
                {formatBRL(totals.receitasAutomaticas + totals.receitasManuais)}
              </td>
              <td className="border-t border-border p-2 text-right tabular-nums">
                {formatBRL(totals.despesasAutomaticas + totals.despesasManuais)}
              </td>
              <td className="border-t border-border p-2"></td>
              <td className="border-t border-border p-2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <dl className="mt-3 space-y-1 text-xs text-fg/70">
        <div className="flex justify-between">
          <dt>Receitas automáticas</dt>
          <dd className="tabular-nums">{formatBRL(totals.receitasAutomaticas)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Receitas manuais</dt>
          <dd className="tabular-nums">{formatBRL(totals.receitasManuais)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Despesas automáticas (faturas/parcelas)</dt>
          <dd className="tabular-nums">{formatBRL(totals.despesasAutomaticas)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Despesas manuais</dt>
          <dd className="tabular-nums">{formatBRL(totals.despesasManuais)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-fg/70">
        Resultado do mês:{' '}
        <span
          className={
            'font-medium tabular-nums ' + (resultadoDoMes < 0 ? 'text-negative' : 'text-positive')
          }
        >
          {formatBRL(resultadoDoMes)}
        </span>{' '}
        — idêntico ao valor da Controladoria para este mês, por construção.
      </p>
    </section>
  );
}
