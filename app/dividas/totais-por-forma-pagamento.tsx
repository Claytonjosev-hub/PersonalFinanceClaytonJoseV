import type { Debt, MonthKey, PaymentMethod } from '@/lib/ledger/types';
import { totalMonthlyByPaymentMethod, totalCommittedByPaymentMethod } from '@/lib/ledger/debts';
import { formatBRL } from '@/lib/format';

function paymentMethodName(paymentMethods: PaymentMethod[], id: string): string {
  if (id === 'sem_forma_pagamento') return 'Sem forma de pagamento';
  return paymentMethods.find((pm) => pm.id === id)?.name ?? 'Forma removida';
}

export function TotaisPorFormaPagamento({
  debts,
  monthsAxis,
  currentMonth,
  paymentMethods,
}: {
  debts: Debt[];
  monthsAxis: MonthKey[];
  currentMonth: MonthKey;
  paymentMethods: PaymentMethod[];
}) {
  const committed = totalCommittedByPaymentMethod(debts, monthsAxis, currentMonth);
  const committedGrandTotal = Object.values(committed).reduce((sum, v) => sum + v, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded border border-border p-6">
        <h2 className="text-lg font-semibold">Total mensal por forma de pagamento</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-border p-2 text-left">Mês</th>
                {paymentMethods.map((pm) => (
                  <th key={pm.id} className="border-b border-border p-2 text-left font-medium">
                    {pm.name}
                  </th>
                ))}
                <th className="border-b border-border p-2 text-left font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {monthsAxis.map((month) => {
                const totals = totalMonthlyByPaymentMethod(debts, month);
                const monthTotal = Object.values(totals).reduce((sum, v) => sum + v, 0);
                return (
                  <tr key={`${month.year}-${month.month}`}>
                    <td className="border-b border-border p-2 tabular-nums">{month.label}</td>
                    {paymentMethods.map((pm) => (
                      <td key={pm.id} className="border-b border-border p-2 tabular-nums">
                        {totals[pm.id] ? formatBRL(totals[pm.id]) : '—'}
                      </td>
                    ))}
                    <td className="border-b border-border p-2 font-medium tabular-nums">
                      {formatBRL(monthTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded border border-border p-6">
        <h2 className="text-lg font-semibold">Total comprometido por forma de pagamento</h2>
        <p className="mt-1 text-sm text-fg/70">
          Soma do saldo devedor de todas as dívidas ativas por forma de pagamento.
        </p>
        <ul className="mt-4 space-y-2">
          {Object.entries(committed).map(([id, total]) => (
            <li key={id} className="flex items-center justify-between border-b border-border pb-2">
              <span>{paymentMethodName(paymentMethods, id)}</span>
              <span className="tabular-nums">{formatBRL(total)}</span>
            </li>
          ))}
          <li className="flex items-center justify-between pt-2 font-semibold">
            <span>Total geral</span>
            <span className="tabular-nums">{formatBRL(committedGrandTotal)}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
