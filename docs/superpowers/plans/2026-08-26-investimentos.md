# Investimentos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the last Fase 1 screen — Investimentos — a new tab that didn't exist in the old spreadsheet, tracking renda fixa, renda variável, and reserva de emergência, with a summary card that will feed the Fase 2 dashboard's patrimônio líquido calculation (`total investido − saldo devedor`, the latter already computed by Plan 2's `totalCommittedByPaymentMethod` + `debts_without_schedule`).

**Architecture:** **Plan 4 of the staged sequence.** Simpler than Plans 2–3 — `investments` is a standalone table (no projection/aggregation math involved, since spec `05` says "valor atual" is updated manually, not computed). Reuses the same `lib/data/*` CRUD pattern and page/section/actions structure established in Plans 1–3.

**Tech Stack:** Unchanged.

**Spec:**
- Product spec: `spec/05-investimentos.md`
- Prior plans: Plans 1–3 in `docs/superpowers/plans/`

## Global Constraints

- No component hardcodes a color; monetary values use `formatBRL` / `tabular-nums`.
- All UI copy is Portuguese (pt-BR).
- Archiving an investment (e.g. resgatado) removes it from the active total but keeps it queryable for history — never a hard delete, same pattern as `categories`/`debts`.
- Any action that mutates `investments` must call `revalidateLedgerPaths()`-equivalent for this screen (just `/investimentos` itself — this table isn't consumed by Controladoria/Fluxo de Caixa, so it doesn't need the broader helper from the Plan 3 hotfix).

---

### Task 1: Investments data layer

**Files:**
- Create: `lib/data/investments.ts`

**Interfaces:**
- Produces: `listInvestments()` (active only), `createInvestment(input)`, `updateInvestment(id, patch)`, `archiveInvestment(id)`.

- [x] **Step 1: Create `lib/data/investments.ts`** following the established pattern (`lib/data/debts.ts` is the closest precedent — same `user_id` injection on create, same `archived_at` soft-delete). Input type covers every column from the Plan 1 migration's `investments` table: `type` (`'renda_fixa' | 'renda_variavel' | 'reserva_emergencia'`), `description`, `institution`, `invested_amount`, `current_amount`, `rate`, `index_type`, `liquidity`, `grace_period`, `applied_at`, `maturity_at`, `ticker`, `quantity`, `average_price`.

- [x] **Step 2: Commit**

```bash
git add lib/data/investments.ts
git commit -m "Add investments data layer"
```

---

### Task 2: Investimentos screen

**Files:**
- Create: `app/investimentos/page.tsx`
- Create: `app/investimentos/actions.ts`
- Create: `app/investimentos/resumo.tsx`
- Create: `app/investimentos/renda-fixa.tsx`
- Create: `app/investimentos/renda-variavel.tsx`
- Create: `app/investimentos/reserva-emergencia.tsx`
- Modify: `components/nav.tsx`

**Interfaces:**
- Consumes: `lib/data/investments.ts` (Task 1).

- [x] **Step 1: Create `app/investimentos/actions.ts`** — `saveInvestment(formData)` (branches on a hidden `type` field to know which optional fields to read — e.g. renda variável reads `ticker`/`quantity`/`average_price` and ignores `rate`/`index_type`; renda fixa reads `rate`/`index_type`/`liquidity`/`grace_period`/`maturity_at`; reserva de emergência only reads `description`/`institution`/`current_amount`/`liquidity`), `archiveInvestmentAction(formData)`, both `revalidatePath('/investimentos')`.

- [x] **Step 2: Create `app/investimentos/resumo.tsx`** — summary cards at the top: total investido, total atual, and rentabilidade acumulada (`current − invested`, colored `text-positive`/`text-negative` by sign) — each broken out per type (Renda Fixa / Renda Variável / Reserva de Emergência) plus a grand total, per spec `05` "Card de resumo no topo".

- [x] **Step 3: Create `app/investimentos/renda-fixa.tsx`** — table/list of `type = 'renda_fixa'` investments: descrição, instituição, valor investido, valor atual, taxa, indexador, liquidez, carência, data de aplicação, data de vencimento — editable inline (reuse the row-form pattern from `app/dividas/cadastro-dividas.tsx`) + an add form. Rentabilidade (`current - invested`) shown as a computed, non-editable column per row.

- [x] **Step 4: Create `app/investimentos/renda-variavel.tsx`** — descrição/ticker, instituição, quantidade, preço médio, valor atual, rentabilidade computed as `current_amount - (quantity * average_price)` when both are set.

- [x] **Step 5: Create `app/investimentos/reserva-emergencia.tsx`** — the simplest of the three: descrição, instituição, valor atual, liquidez only.

- [x] **Step 6: Create `app/investimentos/page.tsx`** — loads `listInvestments()`, partitions by `type` client-side (three arrays), renders `Resumo` then the three sections. Add the nav link `{ href: '/investimentos', label: 'Investimentos' }` in `components/nav.tsx`.

- [x] **Step 7: Verify in the browser** — add one investment of each type, confirm the summary card totals match a hand calculation, edit a renda fixa's valor atual and confirm rentabilidade recalculates with no page-level "recalculate" step, archive one and confirm it drops out of the active total.

- [x] **Step 8: Commit**

```bash
git add app/investimentos components/nav.tsx
git commit -m "Add Investimentos screen: renda fixa, renda variável, reserva de emergência"
```

---

### Task 3: Verify, deploy, checkpoint

- [x] **Step 1: `npx tsc --noEmit` and `npx next lint`** — both clean.

- [x] **Step 2: Push and confirm the Vercel deploy succeeds**

```bash
git push origin main
```

- [ ] **Step 3: Full manual regression as a logged-in user** — needs a human with real Supabase Auth credentials; leave unchecked and flag explicitly if executed without them, per the same rule as Plan 3 Task 6 Step 4.

- [ ] **Step 4: This closes Fase 1's screen set** (spec `00 §7`: Parâmetros, Dívidas, Controladoria, Fluxo de Caixa, Investimentos — all now shipped). What remains for Fase 1 is CSV import (spec `00 §6`) and the one-time migration of the real spreadsheet data (parameters, existing debts, initial balance) into the live system — start that as a new dated plan file in `docs/superpowers/plans/` once this plan is checked off.
