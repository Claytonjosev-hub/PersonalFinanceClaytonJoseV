import type { PaymentMethod } from '@/lib/ledger/types';
import { savePaymentMethod, deletePaymentMethodAction } from './actions';

export function FormasPagamento({ paymentMethods }: { paymentMethods: PaymentMethod[] }) {
  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Cartões e formas de pagamento</h2>
      <div className="mt-4 space-y-2">
        {paymentMethods.map((pm) => (
          <form
            key={pm.id}
            action={savePaymentMethod}
            className="flex flex-wrap items-center gap-2 rounded border border-border p-2"
          >
            <input type="hidden" name="id" value={pm.id} />
            <span
              className="h-3 w-3 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: pm.color ?? undefined }}
            />
            <input
              name="name"
              defaultValue={pm.name}
              className="min-w-[10rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
            />
            <input
              name="due_day"
              type="number"
              min={1}
              max={31}
              placeholder="Dia venc."
              defaultValue={pm.due_day ?? ''}
              className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
            />
            <input
              name="color"
              type="color"
              defaultValue={pm.color ?? '#2563eb'}
              className="h-8 w-10 rounded border border-border bg-bg"
            />
            <button
              type="submit"
              className="rounded border border-border px-3 py-1 text-sm hover:bg-muted"
            >
              Salvar
            </button>
            <button
              formAction={deletePaymentMethodAction}
              className="rounded border border-border px-3 py-1 text-sm text-negative hover:bg-muted"
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
            className="min-w-[10rem] flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
          />
          <input
            name="due_day"
            type="number"
            min={1}
            max={31}
            placeholder="Dia venc."
            className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm tabular-nums"
          />
          <input
            name="color"
            type="color"
            defaultValue="#2563eb"
            className="h-8 w-10 rounded border border-border bg-bg"
          />
          <button
            type="submit"
            className="rounded bg-accent px-3 py-1 text-sm text-accent-foreground"
          >
            Adicionar
          </button>
        </form>
      </div>
    </section>
  );
}
