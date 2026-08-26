# Controladoria & Fluxo de Caixa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the two screens that are the whole reason this project exists instead of the spreadsheet: **Controladoria** (monthly view) and **Fluxo de Caixa** (daily view). Both are pure aggregations over the same data — the single ledger (`transactions`) plus the debt schedule and recurring incomes/expenses from Plan 2 — so they can never diverge from each other the way the Excel tabs did. Also ships the one piece of UI still missing to make either screen meaningful: a manual lançamento (transaction entry) form, since until now `transactions` had no way to be populated except directly in the database.

**Architecture:** **Plan 3 of the staged sequence.** Builds directly on Plan 2's `lib/ledger/` (months axis, debt schedule) and Plan 1/2's `lib/data/` layer. Adds one new module, `lib/ledger/projection.ts`, which is the literal implementation of spec `00 §3`'s "one single source of truth computed at query time" — both Controladoria and Fluxo de Caixa call the *same* aggregation functions at different granularities (month vs. day), which is what guarantees they can't disagree.

**Tech Stack:** Unchanged from Plans 1–2.

**Spec:**
- Product spec: `spec/00-logica-central-e-geral.md` (§3), `spec/03-controladoria.md`, `spec/04-fluxo-de-caixa.md`
- Prior plans: `docs/superpowers/plans/2026-08-26-foundation-auth-and-schema.md`, `docs/superpowers/plans/2026-08-26-ledger-engine-parametros-dividas.md`

## Design decisions carried into this plan (not fully specified upstream — reasonable defaults per spec `00 §8`)

- **Fluxo de Caixa's four expense-related columns collapse to two.** The spec's "Faturas/parcelas automáticas" and "Despesas manuais"/"Gastos diários" distinction doesn't map onto a single `transactions` table with no "linked to invoice" flag. This plan uses: **Despesas automáticas** (debt installments + recurring expenses, placed on a due date) and **Despesas manuais** (every `transactions` row with `type = 'despesa'`, placed on its own `date`). Same two-way split on the income side: **Receitas automáticas** (recurring incomes, placed on `salary_day`) vs. **Receitas manuais** (`transactions` with `type = 'receita'`).
- **Due-date placement fallback:** an automatic expense (debt installment or recurring expense) whose payment method has a `due_day` is placed on that day of the month. If the payment method has no `due_day` (or the expense has no payment method), it's placed on the 1st of the month. This keeps every automatic amount inside the month it belongs to even when no due day was configured, rather than silently dropping it.
- **Manual lançamento screen** lives at `/lancamentos` (not named in the spec) — a single form + recent-entries list, reachable from the nav, that writes to `transactions`. Controladoria and Fluxo de Caixa are read-only, exactly as spec `03`/`04` require.

## Global Constraints

(Same as Plans 1–2 — repeated because they govern this plan directly.)

- No number on Controladoria or Fluxo de Caixa is directly editable — every cell is a calculation over `transactions` + `debts` + `recurring_expenses` + `recurring_incomes`, done at request time.
- Editing a parameter, a debt, or a recurring income/expense must be reflected in both screens immediately (`revalidatePath`), with no separate "recalculate" step.
- All UI copy is Portuguese (pt-BR); monetary values use `formatBRL` / `tabular-nums`.
- No component hardcodes a color.
- A manual `transactions` row is never altered by changes to parameters/debts/recurring entries — only the automatic portion of the projection changes.

---

### Task 1: Transactions data layer & manual lançamento screen

**Files:**
- Create: `lib/data/transactions.ts`
- Create: `app/lancamentos/page.tsx`
- Create: `app/lancamentos/actions.ts`
- Create: `app/lancamentos/novo-lancamento.tsx`
- Modify: `components/nav.tsx` (add "Lançamentos" link)

**Interfaces:**
- Produces: `listTransactionsForMonth(year, month)`, `listRecentTransactions(limit)`, `createTransaction(input)`, `deleteTransaction(id)` in `lib/data/transactions.ts`. Both Task 2/4 aggregation functions consume `listTransactionsForMonth`.

- [ ] **Step 1: Create `lib/data/transactions.ts`** — `listTransactionsForMonth(year: number, month: number)` filters with `.gte('date', firstOfMonth).lt('date', firstOfNextMonth)`; `createTransaction` validates `amount > 0` client-side (mirrors the DB check constraint) and sets `source: 'manual'`; `deleteTransaction(id)` for correcting mistakes (no update — a wrong entry is deleted and re-entered, keeping the ledger simple).

- [ ] **Step 2: Create `app/lancamentos/actions.ts`** — `saveTransaction(formData)` (create only — no edit, per Step 1), `deleteTransactionAction(formData)`, both `revalidatePath('/lancamentos')` **and** `revalidatePath('/controladoria')` **and** `revalidatePath('/fluxo-caixa')` so a new entry shows up immediately everywhere without a manual refresh anywhere else in the app.

- [ ] **Step 3: Create `app/lancamentos/novo-lancamento.tsx`** — form: date (default today), type (receita/despesa radio, filters the category dropdown to match), category, amount, payment method (optional), notes (optional). On submit, clears and refocuses the amount field (client component) for fast repeated entry — this replaces the old spreadsheet workflow of typing many rows in a row.

- [ ] **Step 4: Create `app/lancamentos/page.tsx`** — loads categories, payment methods, and `listRecentTransactions(50)`; renders the form above a read-only recent-entries table (date, type badge, category, amount, payment method, a "Excluir" button per row calling `deleteTransactionAction`).

- [ ] **Step 5: Add the nav link** in `components/nav.tsx`'s `LINKS` array: `{ href: '/lancamentos', label: 'Lançamentos' }`.

- [ ] **Step 6: Verify in the browser** — add a manual receita and a manual despesa, confirm both appear in the recent-entries list immediately, delete one, confirm it disappears.

- [ ] **Step 7: Commit**

```bash
git add lib/data/transactions.ts app/lancamentos components/nav.tsx
git commit -m "Add transactions data layer and manual lançamento screen"
```

---

### Task 2: Ledger engine — monthly projection (Controladoria's math)

**Files:**
- Create: `lib/ledger/projection.ts`

**Interfaces:**
- Consumes: `MonthKey`, all entity types from `lib/ledger/types.ts`; `installmentForMonth` from `lib/ledger/debts.ts` (Plan 2).
- Produces: `computeMonthlyReceitas(...)`, `computeMonthlyDespesas(...)`, `computeSaldoAcumulado(...)`, `computeIndicadores(...)` — the exact shapes below.

- [ ] **Step 1: Define the shared result types** at the top of `lib/ledger/projection.ts`:

```ts
export type CategoryTotal = { categoryId: string | null; categoryName: string; amount: number };
export type PaymentMethodBreakdown = {
  paymentMethodId: string | null;
  paymentMethodName: string;
  total: number;
  byCategory: CategoryTotal[];
};
export type MonthlyReceitas = { byCategory: CategoryTotal[]; total: number };
export type MonthlyDespesas = { byPaymentMethod: PaymentMethodBreakdown[]; total: number };
```

- [ ] **Step 2: Implement `computeMonthlyReceitas`**

```ts
import type { Category, MonthKey, RecurringIncome, Transaction } from './types';
import { monthKeyEquals, monthKeyFromDate } from './months';

export function computeMonthlyReceitas(
  month: MonthKey,
  recurringIncomes: RecurringIncome[],
  transactions: Transaction[],
  categories: Category[]
): MonthlyReceitas {
  const byCategory = new Map<string, number>();

  // Recurring incomes have no category in the schema — grouped under a
  // synthetic "Receitas padrão" bucket, kept separate from manual receita
  // categories so the two sources are never silently merged.
  const recurringTotal = recurringIncomes.reduce((sum, i) => sum + i.amount, 0);
  if (recurringTotal > 0) byCategory.set('__recurring__', recurringTotal);

  for (const tx of transactions) {
    if (tx.type !== 'receita') continue;
    if (!monthKeyEquals(monthKeyFromDate(tx.date), month)) continue;
    const key = tx.category_id ?? '__sem_categoria__';
    byCategory.set(key, (byCategory.get(key) ?? 0) + tx.amount);
  }

  const rows: CategoryTotal[] = Array.from(byCategory.entries()).map(([id, amount]) => ({
    categoryId: id === '__recurring__' || id === '__sem_categoria__' ? null : id,
    categoryName:
      id === '__recurring__'
        ? 'Receitas padrão'
        : id === '__sem_categoria__'
          ? 'Sem categoria'
          : (categories.find((c) => c.id === id)?.name ?? 'Categoria removida'),
    amount,
  }));

  return { byCategory: rows, total: rows.reduce((sum, r) => sum + r.amount, 0) };
}
```

- [ ] **Step 3: Implement `computeMonthlyDespesas`** — groups debt installments (`installmentForMonth` per debt, keyed by `payment_method_id`), recurring expenses (keyed by their own `payment_method_id`/`category_id`), and manual/imported despesa `transactions` (keyed by `payment_method_id`/`category_id`), all into the `PaymentMethodBreakdown[]` shape above, with a `'__sem_forma_pagamento__'` bucket for rows with no payment method — mirroring the `'sem_forma_pagamento'` pattern already used in `lib/ledger/debts.ts`. Debt installments must be labeled distinctly inside `byCategory` (e.g. category name `"Compras Parceladas (dívidas)"` when the debt's own category is unset) so it's visually obvious to the user which portion is automatic, per spec `03 §2`.

- [ ] **Step 4: Implement `computeSaldoAcumulado`**

```ts
export function computeSaldoAcumulado(
  initialBalance: number,
  monthsAxis: MonthKey[],
  monthlyResultados: number[] // same length/order as monthsAxis
): number[] {
  let running = initialBalance;
  return monthlyResultados.map((resultado) => {
    running += resultado;
    return running;
  });
}
```

- [ ] **Step 5: Implement `computeIndicadores`**

```ts
export type Indicadores = {
  percentRendaComprometida: number; // debt installments / total receitas
  percentRendaGasta: number; // total despesas / total receitas
  status: 'deficit' | 'ok';
};

export function computeIndicadores(
  totalReceitas: number,
  totalDespesas: number,
  totalParcelasDividas: number
): Indicadores {
  const safe = (n: number, d: number) => (d === 0 ? 0 : n / d);
  return {
    percentRendaComprometida: safe(totalParcelasDividas, totalReceitas),
    percentRendaGasta: safe(totalDespesas, totalReceitas),
    status: totalReceitas - totalDespesas < 0 ? 'deficit' : 'ok',
  };
}
```

- [ ] **Step 6: Hand-verify** with a small fixture (1 recurring income of 5000, 1 manual receita of 200, 1 debt installment of 500 due that month, 1 recurring expense of 300, 1 manual despesa of 150): `computeMonthlyReceitas` total must be 5200, `computeMonthlyDespesas` total must be 950, resultado 4250, `percentRendaComprometida` = 500/5200 ≈ 9.6%.

- [ ] **Step 7: Commit**

```bash
git add lib/ledger/projection.ts
git commit -m "Add ledger engine: monthly projection for Controladoria"
```

---

### Task 3: Controladoria screen

**Files:**
- Create: `app/controladoria/page.tsx`
- Create: `app/controladoria/receitas.tsx`
- Create: `app/controladoria/despesas.tsx`
- Create: `app/controladoria/resultado-indicadores.tsx`
- Modify: `components/nav.tsx`

**Interfaces:**
- Consumes: `computeMonthlyReceitas`, `computeMonthlyDespesas`, `computeSaldoAcumulado`, `computeIndicadores` (Task 2); `listTransactionsForMonth` (Task 1); `listDebts`, `getMonthsAxis` (Plan 2).

- [ ] **Step 1: Create `app/controladoria/page.tsx`** — loads parameters, categories, payment methods, recurring incomes/expenses, debts, and **`transactions` for every month in the axis** (one query per month via `Promise.all(monthsAxis.map(...))`, or a single range query covering the whole axis then partitioned client-side by `monthKeyFromDate` — prefer the single range query to avoid N round-trips). Computes `MonthlyReceitas`/`MonthlyDespesas`/indicadores for every month up front, then renders one column per month (spec `03`: "um mês por coluna"). Add a `<Nav>` link entry `{ href: '/controladoria', label: 'Controladoria' }`.

- [ ] **Step 2: Create `app/controladoria/receitas.tsx`** — a `Cronograma`-style grid (reuse the pattern from Plan 2's `app/dividas/cronograma.tsx`): rows = every category that appears in any month's `byCategory` (union across the whole axis, so a category isn't silently dropped from the grid just because one month has zero for it), columns = months, plus a bold "Total de receitas" row.

- [ ] **Step 3: Create `app/controladoria/despesas.tsx`** — one row per payment method (bold, with its monthly total), each **expandable** (client component, local `useState` per row) to reveal its `byCategory` breakdown as indented sub-rows underneath, across the same month columns, plus a bold "Total de despesas" row at the bottom.

- [ ] **Step 4: Create `app/controladoria/resultado-indicadores.tsx`** — three more grid rows across the same months: "Resultado do mês" (colored `text-positive`/`text-negative` by sign), "Saldo acumulado" (from `computeSaldoAcumulado`), and a status badge row ("DÉFICIT" / "OK" from `computeIndicadores().status`) plus the two percentage indicators, all `tabular-nums`.

- [ ] **Step 5: Verify in the browser** — with the debt and recurring-expense fixtures from Plan 2 plus a couple of manual lançamentos from Task 1, confirm every column's total matches a hand calculation, confirm the "Compras Parceladas (dívidas)" sub-row appears under the right payment method, and confirm editing a recurring expense's amount (in `/parametros`) changes the corresponding future month here with no extra step.

- [ ] **Step 6: Commit**

```bash
git add app/controladoria components/nav.tsx
git commit -m "Add Controladoria screen: receitas, despesas, resultado, indicadores"
```

---

### Task 4: Ledger engine — daily projection (Fluxo de Caixa's math)

**Files:**
- Modify: `lib/ledger/projection.ts`

**Interfaces:**
- Produces: `computeDailyEntries(month, day, ...): DailyEntry` and `computeDailyEntriesForMonth(month, ...): DailyEntry[]` where `DailyEntry = { day: number; receitasAutomaticas: number; receitasManuais: number; despesasAutomaticas: number; despesasManuais: number; saldo: number }`.

- [ ] **Step 1: Implement day-of-month resolution helpers** — `dueDayInMonth(dueDay: number | null, month: MonthKey): number` clamps a configured `due_day` to the last real day of that month (e.g. `due_day = 31` in February must land on the 28th/29th, not overflow into March) and falls back to `1` when `dueDay` is `null`, per this plan's documented default.

- [ ] **Step 2: Implement `computeDailyEntriesForMonth`** — for each day 1..N of the month: `receitasAutomaticas` = sum of recurring incomes if `day === parameters.salary_day` else 0; `receitasManuais` = sum of manual/imported receita transactions dated that day; `despesasAutomaticas` = sum, across all payment methods, of (debt installments + recurring expenses for that payment method that month) where `dueDayInMonth(paymentMethod.due_day, month) === day`, plus recurring expenses with no payment method placed via their own `due_day` (same fallback rule); `despesasManuais` = sum of manual/imported despesa transactions dated that day. Running `saldo` carries forward from the previous day, seeded by `initialBalance + sum of every prior month's resultado` (reuse `computeSaldoAcumulado` from Task 2 to get the correct starting point for the first day of the selected month).

- [ ] **Step 3: Hand-verify** — using the same fixture as Task 2 Step 6, with the debt's payment method `due_day = 10`: day 10 of that month must show `despesasAutomaticas = 500` (assuming the recurring expense's own category has a different due day) and every other day's automatic columns must be 0 for that debt.

- [ ] **Step 4: Commit**

```bash
git add lib/ledger/projection.ts
git commit -m "Add ledger engine: daily projection for Fluxo de Caixa"
```

---

### Task 5: Fluxo de Caixa screen

**Files:**
- Create: `app/fluxo-caixa/page.tsx`
- Create: `app/fluxo-caixa/tabela-dias.tsx`
- Create: `app/fluxo-caixa/navegacao-mes.tsx`
- Modify: `components/nav.tsx`

**Interfaces:**
- Consumes: `computeDailyEntriesForMonth` (Task 4), `getMonthsAxis` (Plan 2), reads the selected month index from a `?mes=` search param (server component, no client state needed for navigation).

- [ ] **Step 1: Create `app/fluxo-caixa/navegacao-mes.tsx`** — "‹ Mês anterior" / month label / "Mês seguinte ›", each a `<Link href="/fluxo-caixa?mes=N">`, disabled at the axis boundaries.

- [ ] **Step 2: Create `app/fluxo-caixa/tabela-dias.tsx`** — one row per day (Receitas automáticas, Receitas manuais, Despesas automáticas, Despesas manuais, Saldo columns, all `tabular-nums`), with a bold footer row summing every column across the month and a "Resultado do mês" figure explicitly labeled as matching the Controladoria value for the same month (spec `04`: "por construção... sempre idêntico").

- [ ] **Step 3: Create `app/fluxo-caixa/page.tsx`** — reads `searchParams.mes` (default: index of the current real-world month within the axis, clamped to `[0, monthsAxis.length - 1]`), loads the same data sources as Controladoria for the one selected month, computes `computeDailyEntriesForMonth`, renders navigation + table. Add the nav link `{ href: '/fluxo-caixa', label: 'Fluxo de Caixa' }`.

- [ ] **Step 4: Verify in the browser** — confirm the footer's "Resultado do mês" for a given month equals the "Resultado do mês" shown in Controladoria for that same month exactly (this is the core promise of the whole plan — if these two numbers can differ, something reads from two different code paths and must be fixed before moving on). Confirm month navigation stays within the configured axis and the salary day/due-day placements land on the expected days.

- [ ] **Step 5: Commit**

```bash
git add app/fluxo-caixa components/nav.tsx
git commit -m "Add Fluxo de Caixa screen: daily table with month navigation"
```

---

### Task 6: Verify, deploy, checkpoint

- [ ] **Step 1: `npx tsc --noEmit` and `npx next lint`** — both clean before touching git.

- [ ] **Step 2: Cross-screen consistency pass** — for at least two different months in the axis, confirm Controladoria's "Resultado do mês" equals Fluxo de Caixa's footer "Resultado do mês" for that month, and confirm Parâmetros' recurring totals equal what Controladoria attributes to the "Receitas padrão" bucket and the recurring-expense rows.

- [ ] **Step 3: Push and confirm the Vercel deploy succeeds**

```bash
git push origin main
```

- [ ] **Step 4: Full manual regression as a logged-in user** — this needs a human with real Supabase Auth credentials; if this plan is executed by an agent without those credentials, leave this step unchecked and flag it explicitly rather than marking it done on the strength of type-checking alone.

- [ ] **Step 5: Start the next plan** — Investimentos (spec `05`) is the last Fase 1 screen, followed by CSV import (spec `00 §6`) and the initial data migration from the old spreadsheet. Create it as a new dated file in `docs/superpowers/plans/` once this plan is checked off.
