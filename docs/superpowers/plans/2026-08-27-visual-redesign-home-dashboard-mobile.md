# Visual Redesign, Home Dashboard & Mobile Fixes — Implementation Record

> **Process note:** unlike Plans 1–4, this work was not driven by `superpowers:writing-plans` /
> `superpowers:executing-plans` up front. Each piece went through `superpowers:brainstorming`'s
> **bounded** path (short design presented in chat, approved, then implemented directly — no spec
> file, no plan file, per that skill's own rule). This document is written **after the fact** to
> close that gap, so the three pieces below have a record in `docs/superpowers/plans/` like every
> other feature in this project. All steps are already done; checkboxes reflect that.

**Goal:** Bring the whole Fase 1 UI to a single, deliberate visual system (it had been built
screen-by-screen across Plans 1–4 with only ad-hoc Tailwind classes), add the missing "how am I
doing right now" view on Início that spec `00 §7`'s Fase 2 backlog gestures at, and fix the one
real mobile-breaking bug the platform had (the nav forced the whole page to scroll horizontally on
phone-width screens).

**Spec:** No product-spec changes required — this is presentation-layer polish plus one new
read-only screen built entirely from data/logic that Plans 2–3 already expose. See the note at the
bottom of Task 2 about spec `00 §7`'s Fase 2 dashboard item.

---

### Task 1: Visual redesign (all screens)

**Files:**
- Modified: `app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`
- Modified: `components/nav.tsx`, `components/theme-toggle.tsx`
- Modified: every screen under `app/{parametros,dividas,lancamentos,controladoria,fluxo-caixa,investimentos,login}` and `app/page.tsx` (className-only changes)

**What changed:**

- [x] **Design tokens** — added 4 CSS variables layered on top of the 8 originals (`--color-surface`,
      `--color-border-subtle`, `--color-accent-muted`, `--shadow-color`), each mirrored in `.dark`,
      exposed as Tailwind colors (`bg-surface`, `border-border-subtle`, `bg-accent-muted`) and two
      `boxShadow` utilities (`shadow-soft`, `shadow-panel`). The original 8 tokens and the
      light/dark toggle mechanism (`.dark` class + `localStorage`) are untouched.
- [x] **Typeface** — Inter via `next/font/google`, wired through `--font-sans` and
      `tailwind.config.ts`'s `fontFamily.sans` (chosen for its tabular-figure quality — this app is
      mostly tables of money).
- [x] **Typography scale** — page titles `text-2xl font-semibold tracking-tight`, section titles
      `text-lg font-semibold tracking-tight`, field labels `text-xs font-medium uppercase
      tracking-wide text-fg/60` (replacing the old plain `text-sm text-fg/70` labels everywhere).
- [x] **Cards** — `rounded border border-border p-6` → `rounded-xl border-border-subtle bg-surface
      shadow-soft` across every section on every screen.
- [x] **Tables** (Cronograma, Controladoria, Fluxo de Caixa, Totais por forma de pagamento,
      Lançamentos recentes) — muted uppercase sticky headers, zebra striping (`even:bg-fg/[0.02]`),
      right-aligned money columns.
- [x] **Status badges** — dívida (ativa/quitada/recorrente), indicador mensal (DÉFICIT/OK), tipo de
      lançamento (receita/despesa) now render as tinted pills instead of plain colored text.
- [x] **Buttons/inputs/nav** — visible focus rings (`focus-visible:ring-2 ring-accent/50`), consistent
      primary/secondary/destructive button treatment, nav pill with `backdrop-blur` + soft shadow on
      scroll.
- [x] **Verify:** `npx tsc --noEmit`, `npm run lint`, `npm run build` all clean; smoke-tested routes
      with the dev server (no auth available to this agent, so no full visual QA as a logged-in
      user — flagged the same way Plans 1–4 flag this gap).
- [x] **Commit:** `9917f80` — "Redesign UI across all screens with a refined visual system"

---

### Task 2: Home dashboard ("Início")

**Files:**
- New: `app/dashboard-inicio.tsx`
- Modified: `app/page.tsx` (was a placeholder card; now the dashboard)
- Modified: `lib/ledger/projection.ts` (new pure functions, existing ones untouched)

**Interfaces added to `lib/ledger/projection.ts`:**
- `UpcomingItem` type — `{ date, description, amount }`
- `computeUpcomingReceitas(todayIso, horizonDays, parameters, recurringIncomes, transactions)`
- `computeUpcomingDespesas(todayIso, horizonDays, debts, recurringExpenses, paymentMethods, transactions)`
- `daysBetweenIso(fromIso, toIso)` (exported; was already computed inline elsewhere, now shared)

- [x] **Step 1:** `computeUpcomingReceitas`/`computeUpcomingDespesas` — list salary + debt installments
      + recurring expenses + manual transactions due in the next N days, using the **exact same**
      due-day placement rules as `computeDailyEntriesForMonth` (Plan 3 Task 4) — a debt/expense tied
      to a payment method is due on that payment method's `due_day`, not its own; verified by hand
      with a fixture (a recurring expense with its own `due_day=20` but tied to a payment method with
      `due_day=5` correctly surfaces on day 5).
- [x] **Step 2:** `app/page.tsx` — "Saldo atual" reuses `computeDailyEntriesForMonth` (same engine
      Fluxo de Caixa uses) so it can never disagree with that screen. Walks `start_month` → today
      independently of `projection_months` for the balance chain, so the dashboard doesn't break if
      the configured projection window doesn't happen to cover today.
- [x] **Step 3:** "Disponível para gastar" = lowest projected balance between today and the next
      salary date (found by scanning the same daily entries), falling back to the lowest balance in
      a 30-day window when no salary is configured or none falls within the next two months.
- [x] **Step 4:** `app/dashboard-inicio.tsx` — stat row (saldo atual / disponível / total em dívidas,
      the last reusing `totalCommittedByPaymentMethod` from Plan 2, same figure as Dívidas' card) +
      two 30-day lists (recebimentos, pagamentos), same visual system as Task 1.
- [x] **Verify:** logic checked with a standalone fixture script (`tsx`, not committed) mirroring the
      one used to hand-verify Plan 3's ledger functions; `tsc`/`lint`/`build` clean.
- [x] **Commit:** `438623e` — "Add home dashboard: current balance, safe-to-spend, and 30-day outlook"

**Note on spec `00 §7`:** Fase 2's backlog item "Dashboard com gráficos (evolução de saldo, % da
renda comprometida, dívida por credor, patrimônio líquido ao longo do tempo)" is **not** what this
is — this ships no charts and no historical evolution, just the current-moment numbers described
above. Fase 2's chart-based dashboard is still fully open.

---

### Task 3: Mobile responsive fixes

**Files:**
- Modified: `components/nav.tsx`
- Modified: `app/lancamentos/novo-lancamento.tsx`

- [x] **Step 1:** Found the one real bug — `Nav`'s 7 links + theme toggle + "Sair" in one non-wrapping
      row forced the **entire page** to scroll horizontally below `sm` breakpoint (confirmed with a
      375px-viewport screenshot showing the page rendering at ~980px wide).
- [x] **Step 2:** Fixed — header stacks (`flex-col` → `sm:flex-row`), the links row scrolls
      horizontally within itself (`overflow-x-auto`, `shrink-0` per link) instead of forcing page
      overflow, same "swipe sideways" pattern already used by the wide tables in Task 1.
- [x] **Step 3:** Fixed a secondary squeeze — the "Lançar" submit button in `NovoLancamento` got
      crammed next to the Observação field on narrow screens; now `w-full sm:w-auto`.
- [x] **Step 4: Verify** — installed Playwright locally (`npx playwright install chromium`, dev-only,
      not added to `package.json`) and screenshotted at 320px/375px/768px using temporary unauthenticated
      preview routes (`app/dev-preview*`, mounting `Nav`/`DashboardInicio`/forms/tables with fixture
      data — removed after verification, never committed). Confirmed programmatically
      (`document.documentElement.scrollWidth === clientWidth`) that no page has body-level horizontal
      overflow at 375px. Table horizontal scroll (Cronograma, Fluxo de Caixa, Controladoria) confirmed
      correctly contained within its own card, not the page.
- [x] **Commit:** `f31ab90` — "Fix mobile: nav no longer forces the whole page to scroll horizontally"

---

### Task 4: Verify, deploy, checkpoint

- [x] **Step 1:** `npx tsc --noEmit`, `npm run lint`, `npm run build` clean after every task above.
- [x] **Step 2:** Task 1 and Task 2 pushed and deployed to Vercel production individually
      (`9917f80`, `438623e` — both confirmed READY via `vercel inspect` + a smoke `curl`).
- [ ] **Step 3:** Task 3 (`f31ab90`, mobile fixes) is committed locally but not yet pushed as of this
      writing — push and confirm the Vercel deploy the same way as Tasks 1–2.
- [ ] **Step 4: Full manual regression as a logged-in user, on an actual phone** — this agent has no
      Supabase Auth credentials and no real device, so Tasks 2–3 have never been seen rendered with
      real data or on real hardware. Same flag as every prior plan's "needs a human" step — this one
      matters more than most, since Task 3 exists specifically because a similar issue slipped past
      agent-only verification in Task 1.
