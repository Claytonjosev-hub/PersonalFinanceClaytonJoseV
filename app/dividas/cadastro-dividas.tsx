'use client';

import { useState } from 'react';
import type { Debt, PaymentMethod, Category, MonthKey } from '@/lib/ledger/types';
import { computeDebtSchedule } from '@/lib/ledger/debts';
import { formatBRL } from '@/lib/format';
import { saveDebt, closeDebtAction, reopenDebtAction, archiveDebtAction } from './actions';

const STATUS_STYLE: Record<string, string> = {
  ativa: 'bg-muted text-fg/70',
  quitada: 'bg-positive/10 text-positive',
  recorrente: 'bg-accent-muted text-accent',
};

const STATUS_LABEL: Record<string, string> = {
  ativa: 'Ativa',
  quitada: 'Quitada',
  recorrente: 'Recorrente',
};

function DebtRow({
  debt,
  monthsAxis,
  currentMonth,
  paymentMethods,
  categories,
}: {
  debt: Debt;
  monthsAxis: MonthKey[];
  currentMonth: MonthKey;
  paymentMethods: PaymentMethod[];
  categories: Category[];
}) {
  const [isRecurring, setIsRecurring] = useState(debt.is_recurring);
  const schedule = computeDebtSchedule(debt, monthsAxis, currentMonth);
  const lastInstallmentLabel =
    schedule.lastInstallmentMonth === 'recorrente'
      ? 'Recorrente'
      : schedule.lastInstallmentMonth.label;

  return (
    <div className="rounded-lg border border-border-subtle bg-bg/40 p-3">
      <form action={saveDebt} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={debt.id} />
        <div className="min-w-[10rem] flex-1 space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Descrição</label>
          <input
            name="description"
            defaultValue={debt.description}
            className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Forma de pagamento</label>
          <select
            name="payment_method_id"
            defaultValue={debt.payment_method_id ?? ''}
            className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          >
            <option value="">—</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Categoria</label>
          <select
            name="category_id"
            defaultValue={debt.category_id ?? ''}
            className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          >
            <option value="">—</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Valor da parcela</label>
          <input
            name="installment_amount"
            type="number"
            step="0.01"
            defaultValue={debt.installment_amount}
            className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-fg/60">1ª parcela</label>
          <input
            name="first_installment_date"
            type="date"
            defaultValue={debt.first_installment_date}
            className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Nº parcelas</label>
          <input
            name="total_installments"
            type="number"
            min={1}
            defaultValue={debt.total_installments ?? ''}
            disabled={isRecurring}
            className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-40"
          />
        </div>
        <label className="flex items-center gap-1 pb-1 text-xs text-fg/70">
          <input
            type="checkbox"
            name="is_recurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          Recorrente
        </label>
        <button
          type="submit"
          className="rounded-lg border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-fg"
        >
          Salvar
        </button>
        {debt.manually_closed_at ? (
          <button
            formAction={reopenDebtAction}
            className="rounded-lg border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-fg"
          >
            Reabrir
          </button>
        ) : (
          <button
            formAction={closeDebtAction}
            className="rounded-lg border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-fg"
          >
            Quitar manualmente
          </button>
        )}
        <button
          formAction={archiveDebtAction}
          className="rounded-lg border border-negative/30 px-3 py-1 text-sm font-medium text-negative transition-colors hover:bg-negative/10"
        >
          Arquivar
        </button>
      </form>

      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm tabular-nums">
        <div className="flex gap-1">
          <dt className="text-fg/70">Última parcela:</dt>
          <dd>{lastInstallmentLabel}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-fg/70">Valor total:</dt>
          <dd>{schedule.totalValue == null ? '—' : formatBRL(schedule.totalValue)}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-fg/70">Parcelas restantes:</dt>
          <dd>{schedule.remainingInstallments}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-fg/70">Saldo devedor:</dt>
          <dd>{formatBRL(schedule.outstandingBalance)}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="text-fg/70">Status:</dt>
          <dd
            className={
              'rounded-full px-2 py-0.5 text-xs font-medium ' + STATUS_STYLE[schedule.status]
            }
          >
            {STATUS_LABEL[schedule.status]}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function NewDebtForm({
  paymentMethods,
  categories,
}: {
  paymentMethods: PaymentMethod[];
  categories: Category[];
}) {
  const [isRecurring, setIsRecurring] = useState(false);

  return (
    <form action={saveDebt} className="flex flex-wrap items-end gap-2 rounded-lg border border-border-subtle bg-bg/40 p-3">
      <div className="min-w-[10rem] flex-1 space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Descrição</label>
        <input
          name="description"
          placeholder="Ex: Financiamento BYD"
          required
          className="w-full rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Forma de pagamento</label>
        <select
          name="payment_method_id"
          defaultValue=""
          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        >
          <option value="">—</option>
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>
              {pm.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Categoria</label>
        <select
          name="category_id"
          defaultValue=""
          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        >
          <option value="">—</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Valor da parcela</label>
        <input
          name="installment_amount"
          type="number"
          step="0.01"
          required
          className="w-28 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">1ª parcela</label>
        <input
          name="first_installment_date"
          type="date"
          required
          className="rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-fg/60">Nº parcelas</label>
        <input
          name="total_installments"
          type="number"
          min={1}
          disabled={isRecurring}
          className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-40"
        />
      </div>
      <label className="flex items-center gap-1 pb-1 text-xs text-fg/70">
        <input
          type="checkbox"
          name="is_recurring"
          checked={isRecurring}
          onChange={(e) => setIsRecurring(e.target.checked)}
        />
        Recorrente
      </label>
      <button type="submit" className="rounded-lg bg-accent px-3 py-1 text-sm font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90">
        Adicionar
      </button>
    </form>
  );
}

export function CadastroDividas({
  debts,
  monthsAxis,
  currentMonth,
  paymentMethods,
  categories,
}: {
  debts: Debt[];
  monthsAxis: MonthKey[];
  currentMonth: MonthKey;
  paymentMethods: PaymentMethod[];
  categories: Category[];
}) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">Cadastro de dívidas</h2>
      <div className="mt-4 space-y-2">
        {debts.map((debt) => (
          <DebtRow
            key={debt.id}
            debt={debt}
            monthsAxis={monthsAxis}
            currentMonth={currentMonth}
            paymentMethods={paymentMethods}
            categories={categories}
          />
        ))}
        <NewDebtForm paymentMethods={paymentMethods} categories={categories} />
      </div>
    </section>
  );
}
