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
      <h3 className="text-sm font-medium text-fg/70">{title}</h3>
      {categories.map((cat) => (
        <form
          key={cat.id}
          action={saveCategory}
          className="flex items-center gap-2 rounded border border-border p-2"
        >
          <input type="hidden" name="id" value={cat.id} />
          <input
            name="color"
            type="color"
            defaultValue={cat.color ?? '#a3a3a3'}
            className="h-8 w-10 shrink-0 rounded border border-border bg-bg"
          />
          <input
            name="name"
            defaultValue={cat.name}
            className="flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
          />
          <button
            type="submit"
            className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
          >
            Salvar
          </button>
          <button
            formAction={archiveCategoryAction}
            className="rounded border border-border px-2 py-1 text-xs text-negative hover:bg-muted"
          >
            Arquivar
          </button>
        </form>
      ))}

      <form action={saveCategory} className="flex items-center gap-2 pt-1">
        <input type="hidden" name="type" value={type} />
        <input
          name="color"
          type="color"
          defaultValue="#a3a3a3"
          className="h-8 w-10 shrink-0 rounded border border-border bg-bg"
        />
        <input
          name="name"
          placeholder="Nova categoria"
          required
          className="flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-accent px-2 py-1 text-xs text-accent-foreground"
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
    <section className="rounded border border-border p-6">
      <h2 className="text-lg font-semibold">Categorias</h2>
      <div className="mt-4 flex flex-col gap-6 sm:flex-row">
        <CategoryColumn title="Receita" type="receita" categories={receitas} />
        <CategoryColumn title="Despesa" type="despesa" categories={despesas} />
      </div>
    </section>
  );
}
