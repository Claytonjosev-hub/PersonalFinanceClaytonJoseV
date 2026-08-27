import type { Category } from '@/lib/ledger/types';
import { saveCategory, archiveCategoryAction } from './actions';

function CategoryColumn({
  title,
  type,
  categories,
}: {
  title: string;
  type: 'receita' | 'despesa';
  categories: Category[];
}) {
  return (
    <div className="flex-1 space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-fg/60">{title}</h3>
      {categories.map((cat) => (
        <form
          key={cat.id}
          action={saveCategory}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-border-subtle bg-bg/40 p-2"
        >
          <input type="hidden" name="id" value={cat.id} />
          <input
            name="color"
            type="color"
            defaultValue={cat.color ?? '#a3a3a3'}
            className="h-8 w-10 shrink-0 rounded-lg border border-border bg-bg"
          />
          <input
            name="name"
            defaultValue={cat.name}
            className="min-w-[8rem] flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
          <button
            type="submit"
            className="rounded-lg border border-border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted hover:text-fg"
          >
            Salvar
          </button>
          <button
            formAction={archiveCategoryAction}
            className="rounded-lg border border-negative/30 px-2 py-1 text-xs font-medium text-negative transition-colors hover:bg-negative/10"
          >
            Arquivar
          </button>
        </form>
      ))}

      <form action={saveCategory} className="flex flex-wrap items-center gap-2 pt-1">
        <input type="hidden" name="type" value={type} />
        <input
          name="color"
          type="color"
          defaultValue="#a3a3a3"
          className="h-8 w-10 shrink-0 rounded-lg border border-border bg-bg"
        />
        <input
          name="name"
          placeholder="Nova categoria"
          required
          className="min-w-[8rem] flex-1 rounded-lg border border-border bg-bg px-2 py-1 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-2 py-1 text-xs font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90"
        >
          Adicionar
        </button>
      </form>
    </div>
  );
}

export function Categorias({ categories }: { categories: Category[] }) {
  const active = categories.filter((c) => !c.archived_at);
  const receitas = active.filter((c) => c.type === 'receita');
  const despesas = active.filter((c) => c.type === 'despesa');

  return (
    <section className="rounded-xl border border-border-subtle bg-surface p-6 shadow-soft">
      <h2 className="text-lg font-semibold tracking-tight">Categorias</h2>
      <div className="mt-4 flex flex-col gap-6 sm:flex-row">
        <CategoryColumn title="Receita" type="receita" categories={receitas} />
        <CategoryColumn title="Despesa" type="despesa" categories={despesas} />
      </div>
    </section>
  );
}
