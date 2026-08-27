import type { Debt, MonthKey } from '@/lib/ledger/types';
import { installmentForMonth } from '@/lib/ledger/debts';
import { formatBRL } from '@/lib/format';

export function Cronograma({ debts, monthsAxis }: { debts: Debt[]; monthsAxis: MonthKey[] }) {
  if (debts.length === 0) {
    return (
      <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
        <h2 className="text-lg font-semibold tracking-tight">Cronograma de parcelas</h2>
        <p className="mt-2 text-sm text-fg/70">Nenhuma dívida cadastrada ainda.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">Cronograma de parcelas</h2>
      <div className="mt-4 overflow-x-auto rounded-lg">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-b border-border-subtle bg-muted/70 p-2.5 text-left text-xs font-medium uppercase tracking-wide text-fg/60">
                Mês
              </th>
              {debts.map((debt) => (
                <th
                  key={debt.id}
                  className="border-b border-border-subtle bg-muted/70 p-2.5 text-left text-xs font-medium uppercase tracking-wide text-fg/60"
                >
                  {debt.description}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthsAxis.map((month) => (
              <tr key={`${month.year}-${month.month}`} className="even:bg-fg/[0.02]">
                <td className="sticky left-0 border-b border-border-subtle bg-surface p-2 tabular-nums text-fg/70">
                  {month.label}
                </td>
                {debts.map((debt) => {
                  const amount = installmentForMonth(debt, month);
                  return (
                    <td key={debt.id} className="border-b border-border-subtle p-2 text-right tabular-nums">
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
