import type { CategoryTotal, MonthlyReceitas } from '@/lib/ledger/projection';
import type { MonthKey } from '@/lib/ledger/types';
import { formatBRL } from '@/lib/format';

export function Receitas({
  monthsAxis,
  monthlyReceitas,
}: {
  monthsAxis: MonthKey[];
  monthlyReceitas: MonthlyReceitas[];
}) {
  // Union of every category that appears in any month, so a category isn't
  // dropped from the grid just because one month happens to total zero.
  const categoryLabels = new Map<string, string>();
  for (const month of monthlyReceitas) {
    for (const row of month.byCategory) {
      categoryLabels.set(row.categoryId ?? row.categoryName, row.categoryName);
    }
  }

  function amountFor(monthIndex: number, key: string): number {
    return (
      monthlyReceitas[monthIndex].byCategory.find(
        (r: CategoryTotal) => (r.categoryId ?? r.categoryName) === key
      )?.amount ?? 0
    );
  }

  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Receitas</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 border-b border-border bg-bg p-2 text-left">
                Categoria
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
            {Array.from(categoryLabels.entries()).map(([key, label]) => (
              <tr key={key}>
                <td className="sticky left-0 border-b border-border bg-bg p-2">{label}</td>
                {monthsAxis.map((m, i) => (
                  <td
                    key={`${m.year}-${m.month}`}
                    className="border-b border-border p-2 text-right tabular-nums"
                  >
                    {amountFor(i, key) === 0 ? '—' : formatBRL(amountFor(i, key))}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="sticky left-0 border-b border-border bg-bg p-2">
                Total de receitas
              </td>
              {monthsAxis.map((m, i) => (
                <td
                  key={`${m.year}-${m.month}`}
                  className="border-b border-border p-2 text-right tabular-nums text-positive"
                >
                  {formatBRL(monthlyReceitas[i].total)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
