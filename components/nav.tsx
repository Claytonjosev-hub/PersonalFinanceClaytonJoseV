import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { signOut } from '@/app/actions';

const LINKS = [
  { href: '/', label: 'Início' },
  { href: '/parametros', label: 'Parâmetros' },
  { href: '/dividas', label: 'Dívidas' },
  { href: '/lancamentos', label: 'Lançamentos' },
  { href: '/controladoria', label: 'Controladoria' },
  { href: '/fluxo-caixa', label: 'Fluxo de Caixa' },
  { href: '/investimentos', label: 'Investimentos' },
];

export function Nav({ activePath }: { activePath: string }) {
  return (
    <header className="sticky top-0 z-10 flex w-full items-center justify-between border-b border-border-subtle bg-bg/85 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <nav className="flex items-center gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              'rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ' +
              (activePath === link.href
                ? 'bg-accent text-accent-foreground shadow-soft'
                : 'text-fg/60 hover:bg-muted hover:text-fg')
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
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-fg/80 transition-colors hover:bg-muted hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
