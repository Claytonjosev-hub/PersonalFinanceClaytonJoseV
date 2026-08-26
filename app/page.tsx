import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from './actions';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex w-full max-w-md items-center justify-between">
        <h1 className="text-xl font-semibold">Controle Financeiro Pessoal</h1>
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded border border-border p-6">
        <p>
          Logado como <span className="font-medium">{data.user.email}</span>.
        </p>
        <p className="mt-2 text-sm text-fg/70">
          As telas de Parâmetros, Dívidas, Controladoria, Fluxo de Caixa e Investimentos chegam
          nos próximos passos.
        </p>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="rounded border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
