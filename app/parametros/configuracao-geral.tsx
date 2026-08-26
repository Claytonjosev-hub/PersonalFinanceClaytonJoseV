import type { Parameters } from '@/lib/ledger/types';
import { saveConfiguracaoGeral } from './actions';

export function ConfiguracaoGeral({ parameters }: { parameters: Parameters }) {
  return (
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Configuração geral</h2>
      <form action={saveConfiguracaoGeral} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="start_month" className="text-sm text-fg/70">
            Mês inicial do sistema
          </label>
          <input
            id="start_month"
            name="start_month"
            type="date"
            defaultValue={parameters.start_month}
            required
            className="w-full rounded border border-border bg-bg px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="projection_months" className="text-sm text-fg/70">
            Nº de meses projetados
          </label>
          <input
            id="projection_months"
            name="projection_months"
            type="number"
            min={1}
            defaultValue={parameters.projection_months}
            required
            className="w-full rounded border border-border bg-bg px-3 py-2 tabular-nums"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="initial_balance" className="text-sm text-fg/70">
            Saldo inicial em caixa
          </label>
          <input
            id="initial_balance"
            name="initial_balance"
            type="number"
            step="0.01"
            defaultValue={parameters.initial_balance}
            required
            className="w-full rounded border border-border bg-bg px-3 py-2 tabular-nums"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="salary_day" className="text-sm text-fg/70">
            Dia de recebimento do salário
          </label>
          <input
            id="salary_day"
            name="salary_day"
            type="number"
            min={1}
            max={31}
            defaultValue={parameters.salary_day}
            required
            className="w-full rounded border border-border bg-bg px-3 py-2 tabular-nums"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded bg-accent px-4 py-2 text-sm text-accent-foreground"
          >
            Salvar
          </button>
        </div>
      </form>
    </section>
  );
}
