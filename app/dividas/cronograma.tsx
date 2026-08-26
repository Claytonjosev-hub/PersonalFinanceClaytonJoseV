import type { Debt, MonthKey } from '@/lib/ledger/types';
import { installmentForMonth } from '@/lib/ledger/debts';
import { formatBRL } from '@/lib/format';

export function Cronograma({ debts, monthsAxis }: { debts: Debt[]; monthsAxis: MonthKey[] }) {
  if (debts.length === 0) {
    return (
      <section className="rounded border border-border p-6">
        <h2 className="text-lg font-semibold">Cronograma de parcelas</h2>
        <p className="mt-2 text-sm text-fg/70">Nenhuma dívida cadastrada ainda.</p>
      </section>
    );
  }

  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Cronograma de parcelas</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 border-b border-border bg-bg p-2 text-left">Mês</th>
              {debts.map((debt) => (
                <th key={debt.id} className="border-b border-border p-2 text-left font-medium">
                  {debt.description}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthsAxis.map((month) => (
              <tr key={`${month.year}-${month.month}`}>
                <td className="sticky left-0 border-b border-border bg-bg p-2 tabular-nums">
                  {month.label}
                </td>
                {debts.map((debt) => {
                  const amount = installmentForMonth(debt, month);
                  return (
                    <td key={debt.id} className="border-b border-border p-2 tabular-nums">
                      {amount === 0 ? '—' : formatBRL(amount)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
