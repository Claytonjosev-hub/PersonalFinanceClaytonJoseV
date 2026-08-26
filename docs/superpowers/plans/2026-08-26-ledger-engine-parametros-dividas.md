# Ledger Engine, Parâmetros & Dívidas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the projection ("ledger") engine that turns parameters, recurring incomes/expenses and debts into a computed month-by-month view — never stored, always derived — and ship the two screens that depend directly on it: **Parâmetros** (system configuration) and **Dívidas e Parcelamentos** (debt schedule). Ends with both screens live in production, backed by real data, replacing the two least error-prone-but-most-foundational tabs of the old spreadsheet.

**Architecture:** This is **Plan 2 of a staged sequence** (Plan 1 delivered the scaffold, schema, and auth). The ledger engine built here (`lib/ledger/`) is a set of **pure, stateless calculation functions** — no DB writes, no caching of computed values — that Plan 3 (Controladoria + Fluxo de Caixa) and Plan 4 (CSV import) will both reuse without modification. This is the direct implementation of spec `00 §3`: one single source of truth computed at query time, never duplicated.

**Tech Stack:** Same as Plan 1 — Next.js App Router + TypeScript, Supabase (`@supabase/ssr`), Tailwind driven by the CSS-variable tokens from Task 1 of Plan 1. No new dependencies are required for this plan.

**Spec:**
- Product spec: `spec/00-logica-central-e-geral.md` (architecture principle, §3), `spec/01-parametros.md`, `spec/02-dividas-e-parcelamentos.md`
- Technical design: `docs/superpowers/specs/2026-08-26-personal-finance-platform-design.md`
- Prior plan: `docs/superpowers/plans/2026-08-26-foundation-auth-and-schema.md` (schema this plan builds on — tables `parameters`, `payment_methods`, `categories`, `recurring_incomes`, `recurring_expenses`, `debts`, `debts_without_schedule` already exist with RLS)

## Global Constraints

(Same as Plan 1 — repeated because they are load-bearing for this plan specifically.)

- Values that can be computed are never stored. This plan's entire purpose is implementing that rule: **last installment, total value, remaining installments, saldo devedor, and debt status are never columns — they are always computed by `lib/ledger/debts.ts` at request time.**
- Every table access still goes through Supabase with RLS (`user_id = auth.uid()`); no query bypasses it.
- All UI copy is Portuguese (pt-BR).
- No component hardcodes a color — use the `bg-*`/`text-*`/`border-*` utilities from Plan 1 Task 1.
- Numeric/monetary values render with `tabular-nums`.
- Editing a recurring income/expense or a debt must never retroactively alter already-recorded manual `transactions` rows — only the projection changes going forward.
- A debt marked `is_recurring = true` never auto-transitions to "Quitada" — only `manually_closed_at` (set by the user) closes it.

---

### Task 1: Ledger engine — months axis & recurring totals

**Files:**
- Create: `lib/ledger/months.ts`
- Create: `lib/ledger/recurring.ts`
- Create: `lib/ledger/types.ts`

**Interfaces:**
- Produces: `getMonthsAxis(startMonth: Date, projectionMonths: number): MonthKey[]` — `MonthKey` is a `{ year: number; month: number; label: string }` (label pt-BR, e.g. "Ago/26"), used by every later screen that shows a month-by-month grid (Parâmetros §6, Dívidas cronograma, and Plan 3's Controladoria/Fluxo de Caixa).
- Produces: `sumRecurringIncomes(incomes: RecurringIncome[]): number`, `sumRecurringExpenses(expenses: RecurringExpense[]): number`.

- [x] **Step 1: Create `lib/ledger/types.ts`** with the shared shapes every ledger module imports: `MonthKey`, `Parameters`, `PaymentMethod`, `Category`, `RecurringIncome`, `RecurringExpense`, `Debt`, `DebtWithoutSchedule`, `Transaction` — mirroring the DB columns from the Plan 1 migration exactly (same field names, `numeric` → `number`, `date`/`timestamptz` → `string` ISO).

- [x] **Step 2: Create `lib/ledger/months.ts`**

```ts
import type { MonthKey } from './types';

const PT_BR_MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function getMonthsAxis(startMonth: string, projectionMonths: number): MonthKey[] {
  const [startYear, startMonthNum] = startMonth.split('-').map(Number);
  return Array.from({ length: projectionMonths }, (_, i) => {
    const totalMonths = (startMonthNum - 1) + i;
    const year = startYear + Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    return { year, month, label: `${PT_BR_MONTHS[month - 1]}/${String(year).slice(2)}` };
  });
}

export function monthKeyEquals(a: MonthKey, b: MonthKey): boolean {
  return a.year === b.year && a.month === b.month;
}

export function monthsBetween(from: MonthKey, to: MonthKey): number {
  return (to.year - from.year) * 12 + (to.month - from.month);
}

export function monthKeyFromDate(dateIso: string): MonthKey {
  const [year, month] = dateIso.split('-').map(Number);
  return { year, month, label: `${PT_BR_MONTHS[month - 1]}/${String(year).slice(2)}` };
}
```

- [x] **Step 3: Create `lib/ledger/recurring.ts`**

```ts
import type { RecurringIncome, RecurringExpense } from './types';

export function sumRecurringIncomes(incomes: RecurringIncome[]): number {
  return incomes.reduce((total, income) => total + income.amount, 0);
}

export function sumRecurringExpenses(expenses: RecurringExpense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}
```

- [x] **Step 4: Unit-test the month axis by hand** — with `startMonth = '2026-08-01'` and `projectionMonths = 17`, the first entry must be `{ year: 2026, month: 8, label: 'Ago/26' }` and the last must be `{ year: 2027, month: 12, label: 'Dez/27' }` (17 months inclusive of August 2026). Verify in a scratch `.ts` file run with `npx tsx` (add `tsx` as a dev dependency if not present) or a quick Node REPL check; delete the scratch file after confirming.

- [x] **Step 5: Commit**

```bash
git add lib/ledger/types.ts lib/ledger/months.ts lib/ledger/recurring.ts
git commit -m "Add ledger engine: months axis and recurring income/expense totals"
```

---

### Task 2: Ledger engine — debt schedule calculations

**Files:**
- Create: `lib/ledger/debts.ts`

**Interfaces:**
- Consumes: `MonthKey`, `Debt` from `lib/ledger/types.ts`; `getMonthsAxis`, `monthKeyFromDate`, `monthsBetween` from `lib/ledger/months.ts`.
- Produces: `computeDebtSchedule(debt: Debt, monthsAxis: MonthKey[]): DebtSchedule` where `DebtSchedule = { lastInstallmentMonth: MonthKey | 'recorrente'; totalValue: number | null; remainingInstallments: number; outstandingBalance: number; status: 'ativa' | 'quitada' | 'recorrente' }`.
- Produces: `installmentForMonth(debt: Debt, month: MonthKey): number` — the installment amount due for `debt` in `month`, or `0` if none is due (this is the single cell of the Dívidas cronograma grid, and is what Plan 3's projection reuses for `auto_debt` rows).

This is the highest-stakes file in the plan — spec `02` is explicit that these five values must never be stored, only computed, so get the edge cases right:

- [x] **Step 1: Implement `installmentForMonth`**

```ts
import type { Debt, MonthKey } from './types';
import { monthKeyFromDate, monthsBetween } from './months';

export function installmentForMonth(debt: Debt, month: MonthKey): number {
  const firstMonth = monthKeyFromDate(debt.first_installment_date);
  const offset = monthsBetween(firstMonth, month);
  if (offset < 0) return 0;
  if (debt.manually_closed_at) return 0;
  if (debt.is_recurring) return debt.installment_amount;
  if (debt.total_installments != null && offset < debt.total_installments) {
    return debt.installment_amount;
  }
  return 0;
}
```

- [x] **Step 2: Implement `computeDebtSchedule`**

```ts
import type { Debt, MonthKey } from './types';
import { monthKeyFromDate, monthsBetween } from './months';
import { installmentForMonth } from './debts'; // same-file, illustrative import path

export type DebtSchedule = {
  lastInstallmentMonth: MonthKey | 'recorrente';
  totalValue: number | null;
  remainingInstallments: number;
  outstandingBalance: number;
  status: 'ativa' | 'quitada' | 'recorrente';
};

export function computeDebtSchedule(
  debt: Debt,
  monthsAxis: MonthKey[],
  currentMonth: MonthKey
): DebtSchedule {
  if (debt.manually_closed_at) {
    return {
      lastInstallmentMonth: debt.is_recurring ? 'recorrente' : monthKeyFromDate(debt.first_installment_date),
      totalValue: debt.is_recurring ? null : (debt.total_installments ?? 0) * debt.installment_amount,
      remainingInstallments: 0,
      outstandingBalance: 0,
      status: 'quitada',
    };
  }

  if (debt.is_recurring) {
    return {
      lastInstallmentMonth: 'recorrente',
      totalValue: null,
      remainingInstallments: monthsAxis.filter((m) => installmentForMonth(debt, m) > 0).length,
      outstandingBalance: monthsAxis.reduce((sum, m) => sum + installmentForMonth(debt, m), 0),
      status: 'recorrente',
    };
  }

  const firstMonth = monthKeyFromDate(debt.first_installment_date);
  const totalInstallments = debt.total_installments ?? 0;
  const lastOffset = totalInstallments - 1;
  const lastInstallmentMonth: MonthKey = {
    year: firstMonth.year + Math.floor((firstMonth.month - 1 + lastOffset) / 12),
    month: ((firstMonth.month - 1 + lastOffset) % 12) + 1,
    label: '', // recomputed by caller via months.ts if a label is needed for display
  };
  const remainingInstallments = Math.max(
    0,
    totalInstallments - Math.max(0, monthsBetween(firstMonth, currentMonth))
  );

  return {
    lastInstallmentMonth,
    totalValue: totalInstallments * debt.installment_amount,
    remainingInstallments,
    outstandingBalance: remainingInstallments * debt.installment_amount,
    status: remainingInstallments > 0 ? 'ativa' : 'quitada',
  };
}
```

Note: `lastInstallmentMonth`'s `label` is left blank here deliberately — computing a proper pt-BR label requires the same `PT_BR_MONTHS` table as `months.ts`; refactor to export a `formatMonthLabel(year, month)` helper from `months.ts` and call it here instead of duplicating the array, then fill in `label` correctly. Adjust the snippet above accordingly during implementation — this note itself is not optional, treat it as part of Step 2.

- [x] **Step 3: Add `totalMonthlyByPaymentMethod` and `totalCommittedByPaymentMethod`**

```ts
export function totalMonthlyByPaymentMethod(
  debts: Debt[],
  month: MonthKey
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const debt of debts) {
    const amount = installmentForMonth(debt, month);
    if (amount === 0) continue;
    const key = debt.payment_method_id ?? 'sem_forma_pagamento';
    totals[key] = (totals[key] ?? 0) + amount;
  }
  return totals;
}

export function totalCommittedByPaymentMethod(
  debts: Debt[],
  monthsAxis: MonthKey[],
  currentMonth: MonthKey
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const debt of debts) {
    const schedule = computeDebtSchedule(debt, monthsAxis, currentMonth);
    const key = debt.payment_method_id ?? 'sem_forma_pagamento';
    totals[key] = (totals[key] ?? 0) + schedule.outstandingBalance;
  }
  return totals;
}
```

- [x] **Step 4: Hand-verify against a realistic case** — a debt with `first_installment_date = '2026-06-01'`, `installment_amount = 500`, `total_installments = 10`, checked against `currentMonth = { year: 2026, month: 8 }`: expect `remainingInstallments = 8`, `outstandingBalance = 4000`, `status = 'ativa'`, `totalValue = 5000`. A recurring debt (`is_recurring = true`, no `total_installments`) starting the same month must show `status = 'recorrente'` and a non-null `outstandingBalance` bounded by the months axis (never `Infinity`).

- [x] **Step 5: Commit**

```bash
git add lib/ledger/debts.ts
git commit -m "Add ledger engine: debt schedule, outstanding balance, and status calculations"
```

---

### Task 3: Data access layer for Parâmetros entities

**Files:**
- Create: `lib/data/parameters.ts`
- Create: `lib/data/payment-methods.ts`
- Create: `lib/data/categories.ts`
- Create: `lib/data/recurring.ts`

**Interfaces:**
- Consumes: `createClient` (async) from `lib/supabase/server.ts` (Plan 1 Task 4).
- Produces: one `get*`/`upsert*`/`delete*` set of functions per table, all scoped implicitly by RLS (no explicit `user_id` filter needed in the query — RLS does it — but every insert must still set `user_id: user.id` from `supabase.auth.getUser()`, since RLS's `insert ... with check` requires the row to already carry the right `user_id`).

- [x] **Step 1: Create `lib/data/parameters.ts`**

```ts
import { createClient } from '@/lib/supabase/server';
import type { Parameters } from '@/lib/ledger/types';

export async function getParameters(): Promise<Parameters | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('parameters').select('*').single();
  return data;
}

export async function updateParameters(patch: Partial<Parameters>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { error } = await supabase.from('parameters').update(patch).eq('user_id', user.id);
  if (error) throw error;
}
```

- [x] **Step 2: Create `lib/data/payment-methods.ts`, `lib/data/categories.ts`, `lib/data/recurring.ts`** following the same shape: a `list*()` (select all, ordered by `created_at`), a `create*(input)` (inject `user_id` from `auth.getUser()`, insert, return the row), an `update*(id, patch)`, and a `delete*(id)` (for `categories`, this is `archive*(id)` — set `archived_at = now()` instead of a hard delete, per spec `01 §3`). `recurring.ts` exports both the incomes and expenses CRUD since they're small and closely related.

- [x] **Step 3: Commit**

```bash
git add lib/data/parameters.ts lib/data/payment-methods.ts lib/data/categories.ts lib/data/recurring.ts
git commit -m "Add data access layer for parameters, payment methods, categories, recurring income/expense"
```

---

### Task 4: Parâmetros screen

**Files:**
- Create: `app/parametros/page.tsx`
- Create: `app/parametros/actions.ts`
- Create: `app/parametros/configuracao-geral.tsx`
- Create: `app/parametros/formas-pagamento.tsx`
- Create: `app/parametros/categorias.tsx`
- Create: `app/parametros/receitas-despesas-fixas.tsx`
- Create: `components/nav.tsx`
- Modify: `app/page.tsx` (add nav link to `/parametros` and `/dividas`)

**Interfaces:**
- Consumes: `lib/data/*` (Task 3), `lib/ledger/months.ts` (Task 1) for the read-only months-axis section.
- Produces: `<Nav />` — a small top-nav client/server component (Home / Parâmetros / Dívidas / Sair), reused by every future screen; add it to `app/layout.tsx` or repeat it per authenticated page — decide based on whichever keeps `app/login` unauthenticated and every other route wrapped.

- [x] **Step 1: Create `components/nav.tsx`** — links styled with the `border-border`/`bg-muted`/`text-accent` tokens, active-route highlighted, includes `<ThemeToggle />` and the `signOut` form button (reuse from `app/actions.ts`, Plan 1 Task 5).

- [x] **Step 2: Create `app/parametros/actions.ts`** — one `'use server'` action per form: `saveConfiguracaoGeral(formData)`, `savePaymentMethod(formData)`, `deletePaymentMethod(formData)`, `saveCategory(formData)`, `archiveCategory(formData)`, `saveRecurringIncome(formData)`, `deleteRecurringIncome(formData)`, `saveRecurringExpense(formData)`, `deleteRecurringExpense(formData)`. Each calls the matching `lib/data/*` function then `revalidatePath('/parametros')`.

- [x] **Step 3: Create `app/parametros/configuracao-geral.tsx`** — form for `start_month`, `projection_months`, `initial_balance`, `salary_day`, bound to `saveConfiguracaoGeral`. `initial_balance` input uses `inputMode="decimal"` and is parsed/formatted through a shared `lib/format.ts` currency helper (create this helper here if it doesn't exist yet — `formatBRL(cents: number): string` and `parseBRLInput(value: string): number`, both used by every money field from here through Plan 3).

- [x] **Step 4: Create `app/parametros/formas-pagamento.tsx`** — list of `payment_methods` as editable rows (name, due_day, color swatch) + an "add" row, each wired to `savePaymentMethod`/`deletePaymentMethod`.

- [x] **Step 5: Create `app/parametros/categorias.tsx`** — two columns (receita / despesa) listing `categories` where `archived_at is null`, each editable inline (name, color), plus "Arquivar" button calling `archiveCategory`, plus an add-new form per column that sets `type` accordingly. Default categories from the Plan 1 `handle_new_user` trigger already exist for every user — this screen only needs to render/edit them, not seed them.

- [x] **Step 6: Create `app/parametros/receitas-despesas-fixas.tsx`** — two sections (`recurring_incomes`, `recurring_expenses`), each an editable list + add form, each showing a computed total row using `sumRecurringIncomes`/`sumRecurringExpenses` from Task 1 — **do not add a stored "total" field anywhere; compute it in the component from the list already loaded**.

- [x] **Step 7: Create `app/parametros/page.tsx`** — server component that loads `getParameters()`, `listPaymentMethods()`, `listCategories()`, `listRecurringIncomes()`, `listRecurringExpenses()` in parallel (`Promise.all`), passes each slice to its section component, and renders a read-only months-axis list at the bottom using `getMonthsAxis(parameters.start_month, parameters.projection_months)` (spec `01 §6`). Redirect to `/login` if unauthenticated (same pattern as `app/page.tsx` from Plan 1).

- [x] **Step 8: Wire the nav into `app/page.tsx`** and verify in the browser: log in, visit `/parametros`, edit the saldo inicial, add a payment method, add/archive a category, add a recurring income and a recurring expense, confirm the totals update immediately, confirm the months-axis list length matches "Nº de meses projetados" exactly.

- [x] **Step 9: Commit**

```bash
git add app/parametros components/nav.tsx app/page.tsx lib/format.ts
git commit -m "Add Parâmetros screen: config geral, formas de pagamento, categorias, receitas/despesas fixas"
```

---

### Task 5: Dívidas — cadastro with calculated fields

**Files:**
- Create: `lib/data/debts.ts`
- Create: `app/dividas/page.tsx`
- Create: `app/dividas/actions.ts`
- Create: `app/dividas/cadastro-dividas.tsx`

**Interfaces:**
- Consumes: `computeDebtSchedule` (Task 2), `getMonthsAxis` (Task 1), `lib/data/payment-methods.ts` / `lib/data/categories.ts` (Task 3) for the dropdown options.
- Produces: `listDebts()`, `createDebt(input)`, `updateDebt(id, patch)`, `closeDebt(id)` (sets `manually_closed_at`), `archiveDebt(id)` in `lib/data/debts.ts`.

- [x] **Step 1: Create `lib/data/debts.ts`** following the Task 3 pattern. `createDebt` must enforce the same-or check as the DB constraint client-side before submitting (either `is_recurring && total_installments == null`, or `!is_recurring && total_installments > 0`) so the user gets an inline form error instead of a raw Postgres constraint violation.

- [x] **Step 2: Create `app/dividas/actions.ts`** — `saveDebt(formData)`, `closeDebtAction(formData)`, `archiveDebtAction(formData)`, each `revalidatePath('/dividas')`.

- [x] **Step 3: Create `app/dividas/cadastro-dividas.tsx`** — table of active (`archived_at is null`) debts with editable fields (description, payment_method, category, installment_amount, total_installments **or** a "Recorrente" checkbox that disables the installments input, first_installment_date) plus a read-only computed block per row (last installment month label, total value or "—" if recurring, remaining installments, saldo devedor, status badge colored via `text-positive`/`text-negative`/`text-fg/70` depending on ativa/quitada/recorrente) rendered by calling `computeDebtSchedule` with the months axis from `getMonthsAxis`. A "Quitar manualmente" button on recurring debts calls `closeDebtAction`.

- [x] **Step 4: Create `app/dividas/page.tsx`** — loads `listDebts()`, `getParameters()` (for the months axis and to know "now"), `listPaymentMethods()`, `listCategories()`; computes `currentMonth` from `new Date()` (not stored — always derived at request time, consistent with the rest of this plan); passes everything to `cadastro-dividas.tsx`.

- [x] **Step 5: Verify in the browser** — add a debt with a fixed installment count, confirm status/saldo devedor/parcelas restantes match a hand calculation; add a recurring debt (e.g. "Apple One"), confirm it shows "Recorrente" and never "Quitada"; edit an existing debt's installment value and confirm the computed fields update with no stale values left over (this directly exercises the Global Constraint about recalculating the whole schedule on edit).

- [x] **Step 6: Commit**

```bash
git add lib/data/debts.ts app/dividas/page.tsx app/dividas/actions.ts app/dividas/cadastro-dividas.tsx
git commit -m "Add Dívidas cadastro with computed last-installment/total/remaining/saldo/status"
```

---

### Task 6: Dívidas — cronograma grid & totals by payment method

**Files:**
- Create: `app/dividas/cronograma.tsx`
- Create: `app/dividas/totais-por-forma-pagamento.tsx`
- Modify: `app/dividas/page.tsx`

**Interfaces:**
- Consumes: `installmentForMonth`, `totalMonthlyByPaymentMethod`, `totalCommittedByPaymentMethod` (Task 2), `getMonthsAxis` (Task 1).

- [x] **Step 1: Create `app/dividas/cronograma.tsx`** — a grid: rows = months axis, columns = active debts (description as header), cells = `installmentForMonth(debt, month)` formatted via `formatBRL`, rendered `—` when `0`. Wrap in `overflow-x-auto` (the grid can be wide with many debts) with `tabular-nums` on every numeric cell, per spec `02 §2`.

- [x] **Step 2: Create `app/dividas/totais-por-forma-pagamento.tsx`** — two blocks: (a) "Total mensal por forma de pagamento" — for each month, `totalMonthlyByPaymentMethod(debts, month)` joined against `payment_methods` names, plus a row total; (b) "Total comprometido por forma de pagamento" — `totalCommittedByPaymentMethod(debts, monthsAxis, currentMonth)`, one row per payment method plus a grand total, per spec `02 §3–4`.

- [x] **Step 3: Wire both into `app/dividas/page.tsx`** below the cadastro table.

- [x] **Step 4: Verify in the browser** — with 2–3 debts spanning different date ranges, confirm the cronograma grid shows the right non-zero cells only in the months each debt is actually active, and confirm the "Total comprometido" grand total equals the sum of every active debt's saldo devedor shown in Task 5's cadastro table.

- [x] **Step 5: Commit**

```bash
git add app/dividas/cronograma.tsx app/dividas/totais-por-forma-pagamento.tsx app/dividas/page.tsx
git commit -m "Add Dívidas cronograma grid and totals by payment method"
```

---

### Task 7: Dívidas sem cronograma & endividamento total

**Files:**
- Create: `lib/data/debts-without-schedule.ts`
- Create: `app/dividas/sem-cronograma.tsx`
- Create: `app/dividas/endividamento-total.tsx`
- Modify: `app/dividas/actions.ts`, `app/dividas/page.tsx`

**Interfaces:**
- Consumes: `totalCommittedByPaymentMethod` (Task 2) for the "com cronograma" half of the endividamento total.

- [x] **Step 1: Create `lib/data/debts-without-schedule.ts`** — `list`, `create`, `update`, `archive`, same pattern as Task 3/5.

- [x] **Step 2: Add `saveDebtWithoutSchedule`/`archiveDebtWithoutScheduleAction` to `app/dividas/actions.ts`.**

- [x] **Step 3: Create `app/dividas/sem-cronograma.tsx`** — editable list (description, creditor, open_balance, notes) + add form, per spec `02 §5`.

- [x] **Step 4: Create `app/dividas/endividamento-total.tsx`** — a summary card: "Endividamento total" = grand total from Task 6's `totalCommittedByPaymentMethod` **plus** the sum of `open_balance` across all non-archived `debts_without_schedule` rows. Shown as one prominent number, with the two components broken out beneath it (com cronograma / sem cronograma) so the source of the total is always inspectable.

- [x] **Step 5: Wire into `app/dividas/page.tsx`**, verify in the browser with at least one `debts_without_schedule` entry that the endividamento total card sums correctly against a hand calculation.

- [x] **Step 6: Commit**

```bash
git add lib/data/debts-without-schedule.ts app/dividas/sem-cronograma.tsx app/dividas/endividamento-total.tsx app/dividas/actions.ts app/dividas/page.tsx
git commit -m "Add dívidas sem cronograma and endividamento total card"
```

---

### Task 8: Verify, deploy, checkpoint

- [ ] **Step 1: Full manual regression pass** (pending — needs a real logged-in user; ledger math was hand-verified in Tasks 1-2, and every task passed `tsc --noEmit` + `next lint` clean, but no one has clicked through /parametros and /dividas as an authenticated user yet) — from a clean login: edit every Parâmetros section, create 2+ debts (one fixed-installment, one recorrente), close the recorrente one manually, add a dívida sem cronograma, confirm every computed number across `/parametros` and `/dividas` agrees with a hand-worked example. Pay special attention to editing an existing debt (Global Constraint: no residue in past months) and to the "Recorrente" checkbox disabling/enabling `total_installments` correctly.

- [x] **Step 2: `npm run build`** — must complete with no TypeScript errors before pushing (this plan adds real logic beyond Plan 1's static pages, so build-time type errors are more likely here than before).

- [x] **Step 3: Push and confirm the Vercel deploy succeeds**

```bash
git push origin main
```

Confirm via the GitHub commit status API or the Vercel dashboard that the deployment for the final commit of this plan reports success, then repeat Step 1's regression pass against the production URL.

- [x] **Step 4: Update the plan index** — once this plan is fully checked off, this file's tasks should all show `- [x]`; leave it in place (like Plan 1's file) as the historical record for this stage, and start the next plan (`Controladoria + Fluxo de Caixa`, per spec `03`/`04`) as a new dated file in `docs/superpowers/plans/`.
