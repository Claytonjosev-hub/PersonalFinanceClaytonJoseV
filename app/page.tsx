import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Nav } from '@/components/nav';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <Nav activePath="/" />
      <main className="mx-auto flex max-w-md flex-col gap-6 p-8">
        <div className="rounded border border-border p-6">
          <p>
            Logado como <span className="font-medium">{data.user!.email}</span>.
          </p>
          <p className="mt-2 text-sm text-fg/70">
            As telas de Controladoria, Fluxo de Caixa e Investimentos chegam nos próximos passos.
          </p>
        </div>
      </main>
    </div>
  );
}
