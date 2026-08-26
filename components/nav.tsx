import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { signOut } from '@/app/actions';

const LINKS = [
  { href: '/', label: 'Início' },
  { href: '/parametros', label: 'Parâmetros' },
  { href: '/dividas', label: 'Dívidas' },
  { href: '/lancamentos', label: 'Lançamentos' },
];

export function Nav({ activePath }: { activePath: string }) {
  return (
    <header className="flex w-full items-center justify-between border-b border-border px-6 py-4">
      <nav className="flex items-center gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              'rounded-full px-3 py-1.5 text-sm transition-colors ' +
              (activePath === link.href
                ? 'bg-accent text-accent-foreground'
                : 'text-fg/70 hover:bg-muted')
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <form action={signOut}>
          <button
            type="submit"
            className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
