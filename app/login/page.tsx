import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { signIn } from './actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    redirect('/');
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form
        action={signIn}
        className="w-full max-w-sm space-y-4 rounded-xl border border-border-subtle bg-surface p-8 shadow-panel"
      >
        <h1 className="text-xl font-semibold tracking-tight">Entrar</h1>
        {error && <p className="text-sm text-negative">{error}</p>}
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-fg/60">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-medium uppercase tracking-wide text-fg/60">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground shadow-soft transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
