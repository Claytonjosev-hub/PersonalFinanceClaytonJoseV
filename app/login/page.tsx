import Link from 'next/link';
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
      <form action={signIn} className="w-full max-w-sm space-y-4 rounded border border-border p-6">
        <h1 className="text-xl font-semibold">Entrar</h1>
        {error && <p className="text-sm text-negative">{error}</p>}
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded border border-border bg-bg px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="text-sm">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded border border-border bg-bg px-3 py-2"
          />
        </div>
        <button type="submit" className="w-full rounded bg-accent px-3 py-2 text-white">
          Entrar
        </button>
        <p className="text-sm text-fg/70">
          Não tem conta?{' '}
          <Link href="/signup" className="text-accent underline">
            Cadastre-se
          </Link>
        </p>
      </form>
    </main>
  );
}
