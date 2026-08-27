import type { PaymentMethod } from '@/lib/ledger/types';
import { savePaymentMethod, deletePaymentMethodAction } from './actions';

export function FormasPagamento({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">Cartões e formas de pagamento</h2>
      <div className="mt-4 space-y-2">
        {paymentMethods.map((pm) => (
          <form
            key={pm.id}
            action={savePaymentMethod}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-bg/40 p-2"
          >
            <input type="hidden" name="id" value={pm.id} />
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: pm.color ?? undefined }}
            />
            <input
              name="name"
              defaultValue={pm.name}
              className="min-w-[10rem] flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <input
              name="due_day"
              type="number"
              min={1}
              max={31}
              placeholder="Dia venc."
              defaultValue={pm.due_day ?? ''}
              className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
            />
            <input
              name="color"
              type="color"
              defaultValue={pm.color ?? '#2563eb'}
              className="h-8 w-10 rounded-lg border border-border bg-bg"
            />
            <button
              type="submit"
              className="rounded-lg border border-border px-3 py-1 text-sm font-medium transition-colors hover:bg-muted hover:text-fg"
            >
              Salvar
            </button>
            <button
              formAction={deletePaymentMethodAction}
              className="rounded-lg border border-negative/30 px-3 py-1 text-sm font-medium text-negative transition-colors hover:bg-negative/10"
            >
              Remover
            </button>
          </form>
        ))}

        <form action={savePaymentMethod} className="flex flex-wrap items-center gap-2 pt-2">
          <input
            name="name"
            placeholder="Nova forma de pagamento"
            required
            className="min-w-[10rem] flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
          <input
            name="due_day"
            type="number"
            min={1}
            max={31}
            placeholder="Dia venc."
            className="w-24 rounded-lg border border-border bg-bg px-2 py-1 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
          <input
            name="color"
            type="color"
            defaultValue="#2563eb"
            className="h-8 w-10 rounded-lg border border-border bg-bg"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-3 py-1 text-sm font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90"
          >
            Adicionar
          </button>
        </form>
      </div>
    </section>
  );
}
