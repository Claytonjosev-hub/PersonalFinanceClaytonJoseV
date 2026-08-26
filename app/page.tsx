import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Controle Financeiro Pessoal</h1>
      <ThemeToggle />
    </main>
  );
}
