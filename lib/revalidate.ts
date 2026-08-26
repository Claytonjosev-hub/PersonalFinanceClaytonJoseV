import { revalidatePath } from 'next/cache';

// Every screen that reads from the shared ledger engine (lib/ledger/), so
// any mutation to parameters, payment methods, categories, recurring
// incomes/expenses, debts, or transactions is reflected everywhere
// immediately — never just on the page the form happened to be on.
const LEDGER_DEPENDENT_PATHS = [
  '/parametros',
  '/dividas',
  '/lancamentos',
  '/controladoria',
  '/fluxo-caixa',
] as const;

export function revalidateLedgerPaths() {
  for (const path of LEDGER_DEPENDENT_PATHS) {
    revalidatePath(path);
  }
}
