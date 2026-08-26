# Foundation: Scaffold, Design System, Database Schema & Auth — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js app skeleton, the light/dark design system, the full Supabase database schema with RLS, and working email/password auth — ending in a live, deployed app where a real user can sign up, log in, see a protected page, and log out.

**Architecture:** Next.js 15 App Router + TypeScript, Tailwind CSS driven entirely by CSS variables (never hardcoded colors), Supabase for Postgres + Auth + RLS accessed via `@supabase/ssr`. This is **Plan 1 of a staged sequence** delivering Fase 1 of the product spec; later plans (ledger engine + Parâmetros + Dívidas, then Controladoria + Fluxo de Caixa + Investimentos + lançamento manual, then CSV import + data migration) build on top of what this plan creates. Ending this plan with a real deploy gives an early, motivating checkpoint and proves the whole GitHub → Vercel → Supabase pipeline works before more features pile on.

**Tech Stack:** Next.js ^15.0.3 (App Router, TS), React ^19, Tailwind CSS ^3.4, `@supabase/ssr` ^0.5, `@supabase/supabase-js` ^2.45, deployed on Vercel.

**Spec:**
- Product spec: `spec/00-logica-central-e-geral.md` (and `spec/01`–`spec/05` for later plans)
- Technical design: `docs/superpowers/specs/2026-08-26-personal-finance-platform-design.md`

## Global Constraints

- Every table has `user_id` and RLS restricting access to `user_id = auth.uid()` (spec `00 §4`).
- Values that can be computed are never stored — no "status", "total", or "saldo" column gets written to disk if it can be derived at query time (spec `02` — this is the entire reason this project exists instead of the spreadsheet).
- All UI copy is Portuguese (pt-BR), matching the spec documents.
- Light and dark mode both work from day one, driven only by CSS variables — no component may hardcode a color (spec `00 §5`).
- Numeric/monetary values render with `tabular-nums` so columns of numbers align.
- No secret (DB password, service role key, real personal financial figures) is ever written to a file tracked by git. `.env.local` and any generated seed data stay gitignored.
- `transactions.source` only ever has `'manual'` or `'import_csv'` in the database — projected debt/recurring-expense entries (`auto_debt`, `auto_recurring`) are computed in-memory by the ledger engine in a later plan, never persisted, per the "never store what can be calculated" rule above.

---

### Task 1: Project scaffold + design-system tokens

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `.eslintrc.json`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

**Interfaces:**
- Produces: Tailwind color utilities `bg-bg`, `text-fg`, `bg-muted`, `border-border`, `bg-accent`, `text-positive`, `text-negative` (and their `/opacity` variants), backed by CSS variables in `app/globals.css`. Every later task must use these instead of raw color values.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "controle-financeiro-pessoal",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^15.0.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.45.4"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^22.7.5",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^3.4.13",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "eslint-config-next": "^15.0.3"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`, `postcss.config.mjs`, `.eslintrc.json`**

`next.config.mjs`:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {};

export default nextConfig;
```

`postcss.config.mjs`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`.eslintrc.json`:
```json
{
  "extends": "next/core-web-vitals"
}
```

- [ ] **Step 4: Create `tailwind.config.ts` mapping Tailwind colors to CSS variables**

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        positive: 'rgb(var(--color-positive) / <alpha-value>)',
        negative: 'rgb(var(--color-negative) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: '0.75rem',
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Create `app/globals.css` with the light/dark token set**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg: 255 255 255;
  --color-fg: 23 23 23;
  --color-muted: 245 245 245;
  --color-border: 229 229 229;
  --color-accent: 37 99 235;
  --color-positive: 22 163 74;
  --color-negative: 220 38 38;
}

.dark {
  --color-bg: 10 10 10;
  --color-fg: 245 245 245;
  --color-muted: 23 23 23;
  --color-border: 38 38 38;
  --color-accent: 96 165 250;
  --color-positive: 74 222 128;
  --color-negative: 248 113 113;
}

body {
  background-color: rgb(var(--color-bg));
  color: rgb(var(--color-fg));
}
```

- [ ] **Step 6: Create `app/layout.tsx` with a pre-paint theme script (avoids a light/dark flash)**

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Controle Financeiro Pessoal',
  description: 'Plataforma pessoal de controle financeiro',
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('theme');
    var isDark = stored === 'dark' || (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create a placeholder `app/page.tsx` (Task 5 will replace this with the real auth-aware home)**

```tsx
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <h1 className="text-2xl font-semibold">Controle Financeiro Pessoal</h1>
    </main>
  );
}
```

- [ ] **Step 8: Install dependencies and verify the scaffold**

Run: `npm install`
Then: `npm run dev`

Open `http://localhost:3000` in the browser — expect to see "Controle Financeiro Pessoal" centered on the page, white background, dark text. Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json next.config.mjs postcss.config.mjs tailwind.config.ts .eslintrc.json app/globals.css app/layout.tsx app/page.tsx package-lock.json
git commit -m "Scaffold Next.js app with Tailwind design-system tokens"
```

---

### Task 2: Light/dark theme toggle

**Files:**
- Create: `components/theme-toggle.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: Tailwind color utilities from Task 1 (`border-border`, `bg-accent`, `bg-muted`, `text-fg`).
- Produces: `ThemeToggle` — `export function ThemeToggle(): JSX.Element`, a client component with no props, reads/writes `localStorage['theme']` (`'light' | 'dark' | 'system'`) and toggles the `dark` class on `document.documentElement`.

- [ ] **Step 1: Create `components/theme-toggle.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';

type ThemeChoice = 'light' | 'dark' | 'system';

function applyTheme(choice: ThemeChoice) {
  const isDark =
    choice === 'dark' ||
    (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>('system');

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as ThemeChoice | null) ?? 'system';
    setChoice(stored);
  }, []);

  function selectTheme(next: ThemeChoice) {
    setChoice(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  }

  const options: { value: ThemeChoice; label: string }[] = [
    { value: 'light', label: 'Claro' },
    { value: 'system', label: 'Sistema' },
    { value: 'dark', label: 'Escuro' },
  ];

  return (
    <div className="flex gap-1 rounded-full border border-border p-1 text-sm">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => selectTheme(option.value)}
          aria-pressed={choice === option.value}
          className={
            'rounded-full px-3 py-1 transition-colors ' +
            (choice === option.value ? 'bg-accent text-white' : 'text-fg/70 hover:bg-muted')
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into `app/page.tsx`**

```tsx
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Controle Financeiro Pessoal</h1>
      <ThemeToggle />
    </main>
  );
}
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, open `http://localhost:3000`.
Click "Escuro" — background should turn near-black and text near-white immediately. Click "Claro" — back to white/black. Click "Sistema" — matches the OS/browser color-scheme preference. Reload the page after picking "Escuro" — it must stay dark (no flash of light mode first).

- [ ] **Step 4: Commit**

```bash
git add components/theme-toggle.tsx app/page.tsx
git commit -m "Add light/dark/system theme toggle"
```

---

### Task 3: Database schema, RLS policies, and new-user bootstrap

**Files:**
- Create: `supabase/migrations/001_schema_and_rls.sql`

**Interfaces:**
- Produces: tables `public.parameters`, `public.payment_methods`, `public.categories`, `public.recurring_incomes`, `public.recurring_expenses`, `public.debts`, `public.debts_without_schedule`, `public.transactions`, `public.investments` — exact column names below are load-bearing for every later plan.

- [ ] **Step 1: Write the migration file**

```sql
-- 001_schema_and_rls.sql
-- Controle Financeiro Pessoal — schema inicial (Fase 1).
-- Rodar uma única vez no SQL Editor do Supabase, antes do primeiro deploy.

create extension if not exists "pgcrypto";

-- 1. parameters --------------------------------------------------------------
create table public.parameters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  start_month date not null default date_trunc('month', now())::date,
  projection_months integer not null default 17,
  initial_balance numeric(14,2) not null default 0,
  salary_day integer not null default 1 check (salary_day between 1 and 31),
  theme_preference text not null default 'system' check (theme_preference in ('light','dark','system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. payment_methods ----------------------------------------------------------
create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  due_day integer check (due_day between 1 and 31),
  color text,
  created_at timestamptz not null default now()
);

-- 3. categories ----------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('receita','despesa')),
  color text,
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- 4. recurring_incomes ----------------------------------------------------------
create table public.recurring_incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null,
  created_at timestamptz not null default now()
);

-- 5. recurring_expenses ----------------------------------------------------------
create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(14,2) not null,
  due_day integer check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);

-- 6. debts -----------------------------------------------------------------------
-- Nunca armazena última parcela, valor total, parcelas restantes ou saldo devedor
-- — tudo isso é calculado em consulta pelo motor de projeção (Plan 2).
create table public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  installment_amount numeric(14,2) not null,
  total_installments integer,
  is_recurring boolean not null default false,
  first_installment_date date not null,
  manually_closed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint debts_installments_or_recurring check (
    (is_recurring and total_installments is null) or
    (not is_recurring and total_installments is not null and total_installments > 0)
  )
);

-- 7. debts_without_schedule ---------------------------------------------------------
create table public.debts_without_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  creditor text not null,
  open_balance numeric(14,2) not null,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- 8. transactions ------------------------------------------------------------------
-- source só guarda 'manual'/'import_csv': lançamentos projetados de dívidas e
-- despesas fixas ('auto_debt'/'auto_recurring') são calculados em memória pelo
-- motor de projeção (Plan 2), nunca gravados aqui.
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('receita','despesa')),
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  payment_method_id uuid references public.payment_methods(id) on delete set null,
  notes text,
  source text not null default 'manual' check (source in ('manual','import_csv')),
  created_at timestamptz not null default now()
);

-- 9. investments ---------------------------------------------------------------------
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('renda_fixa','renda_variavel','reserva_emergencia')),
  description text not null,
  institution text,
  invested_amount numeric(14,2) not null default 0,
  current_amount numeric(14,2) not null default 0,
  rate text,
  index_type text check (index_type in ('cdi','ipca','prefixado')),
  liquidity text,
  grace_period text,
  applied_at date,
  maturity_at date,
  ticker text,
  quantity numeric(14,6),
  average_price numeric(14,2),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes on the column every query filters by ---------------------------------------
create index parameters_user_id_idx on public.parameters(user_id);
create index payment_methods_user_id_idx on public.payment_methods(user_id);
create index categories_user_id_idx on public.categories(user_id);
create index recurring_incomes_user_id_idx on public.recurring_incomes(user_id);
create index recurring_expenses_user_id_idx on public.recurring_expenses(user_id);
create index debts_user_id_idx on public.debts(user_id);
create index debts_without_schedule_user_id_idx on public.debts_without_schedule(user_id);
create index transactions_user_id_date_idx on public.transactions(user_id, date);
create index investments_user_id_idx on public.investments(user_id);

-- Row Level Security -------------------------------------------------------------------
alter table public.parameters enable row level security;
alter table public.payment_methods enable row level security;
alter table public.categories enable row level security;
alter table public.recurring_incomes enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.debts enable row level security;
alter table public.debts_without_schedule enable row level security;
alter table public.transactions enable row level security;
alter table public.investments enable row level security;

-- Same select/insert/update/delete-own-rows policy shape on every table.
do $$
declare
  t text;
begin
  foreach t in array array[
    'parameters','payment_methods','categories','recurring_incomes',
    'recurring_expenses','debts','debts_without_schedule','transactions','investments'
  ]
  loop
    execute format('create policy "%s_select_own" on public.%I for select using (user_id = auth.uid());', t, t);
    execute format('create policy "%s_insert_own" on public.%I for insert with check (user_id = auth.uid());', t, t);
    execute format('create policy "%s_update_own" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid());', t, t);
    execute format('create policy "%s_delete_own" on public.%I for delete using (user_id = auth.uid());', t, t);
  end loop;
end $$;

-- New-user bootstrap: default parameters row + default categories -----------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.parameters (user_id, start_month, projection_months, initial_balance, salary_day)
  values (new.id, date_trunc('month', now())::date, 17, 0, 1);

  insert into public.categories (user_id, name, type, is_default) values
    (new.id, 'Salário', 'receita', true),
    (new.id, 'Bonificação', 'receita', true),
    (new.id, 'Outras Receitas', 'receita', true),
    (new.id, 'Compras Parceladas', 'despesa', true),
    (new.id, 'Assinaturas e Mensalidades', 'despesa', true),
    (new.id, 'Supermercado', 'despesa', true),
    (new.id, 'Alimentação', 'despesa', true),
    (new.id, 'Saídas e Lazer', 'despesa', true),
    (new.id, 'Despesas Fixas', 'despesa', true),
    (new.id, 'Outras Despesas', 'despesa', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 2: Commit the migration file**

```bash
git add supabase/migrations/001_schema_and_rls.sql
git commit -m "Add initial database schema, RLS policies, and new-user bootstrap trigger"
```

- [ ] **Step 3: CHECKPOINT — ask the user to apply the migration now**

This step cannot be done by the assistant: applying it requires elevated database
access (DB password or service role key) that the design explicitly avoids
handling. Ask the user to:
1. Open the Supabase dashboard for project `xmjzdqzrcfiovkqonffu` → SQL Editor.
2. Paste the full contents of `supabase/migrations/001_schema_and_rls.sql`.
3. Run it, and confirm it reports success (e.g. "Success. No rows returned").

Do not proceed to Task 5's live verification until the user confirms this ran successfully.

---

### Task 4: Supabase client/server utilities and session middleware

**Files:**
- Create: `.env.local.example`
- Create: `.env.local` (not committed — already covered by `.gitignore`)
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

**Interfaces:**
- Produces: `createClient()` from `lib/supabase/client.ts` — browser client, synchronous return, for use in Client Components.
- Produces: `createClient()` from `lib/supabase/server.ts` — `async function createClient(): Promise<SupabaseClient>`, for use in Server Components and Server Actions.

- [ ] **Step 1: Create `.env.local.example`**

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

- [ ] **Step 2: Create the real `.env.local`**

Create a file named `.env.local` in the project root (this file is gitignored — never commit it)
with the Project URL and anon public key already shared for this project:

```
NEXT_PUBLIC_SUPABASE_URL=https://xmjzdqzrcfiovkqonffu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon public key shared for this project>
```

- [ ] **Step 3: Create `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 4: Create `lib/supabase/server.ts`**

```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render, where cookies can't be
            // set — safe to ignore because middleware.ts refreshes the
            // session on every request anyway.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 5: Create `middleware.ts` at the project root**

```ts
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 6: Verify the build succeeds**

Run: `npm run build`
Expected: build completes with no TypeScript errors (env vars are read via `!` non-null
assertions, so missing-var errors would only surface at runtime, not at build time).

- [ ] **Step 7: Commit**

```bash
git add .env.local.example lib/supabase/client.ts lib/supabase/server.ts middleware.ts
git commit -m "Add Supabase client/server utilities and session-refresh middleware"
```

---

### Task 5: Signup, login, logout, and the protected home page

**Files:**
- Create: `app/login/page.tsx`
- Create: `app/login/actions.ts`
- Create: `app/signup/page.tsx`
- Create: `app/signup/actions.ts`
- Create: `app/actions.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `createClient` (async) from `lib/supabase/server.ts` (Task 4), `ThemeToggle` from `components/theme-toggle.tsx` (Task 2).
- Produces: server actions `signIn(formData: FormData)`, `signUp(formData: FormData)`, `signOut()`.

- [ ] **Step 1: Create `app/login/actions.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signIn(formData: FormData) {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/');
}
```

- [ ] **Step 2: Create `app/login/page.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `app/signup/actions.ts`**

```ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signUp(formData: FormData) {
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/signup?success=${encodeURIComponent('Conta criada. Verifique seu e-mail para confirmar antes de entrar.')}`
  );
}
```

- [ ] **Step 4: Create `app/signup/page.tsx`**

```tsx
import Link from 'next/link';
import { signUp } from './actions';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form action={signUp} className="w-full max-w-sm space-y-4 rounded border border-border p-6">
        <h1 className="text-xl font-semibold">Criar conta</h1>
        {error && <p className="text-sm text-negative">{error}</p>}
        {success && <p className="text-sm text-positive">{success}</p>}
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
            minLength={6}
            className="w-full rounded border border-border bg-bg px-3 py-2"
          />
        </div>
        <button type="submit" className="w-full rounded bg-accent px-3 py-2 text-white">
          Criar conta
        </button>
        <p className="text-sm text-fg/70">
          Já tem conta?{' '}
          <Link href="/login" className="text-accent underline">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Create `app/actions.ts` (sign-out)**

```ts
'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

- [ ] **Step 6: Replace `app/page.tsx` with the real, auth-aware home**

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut } from './actions';

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex w-full max-w-md items-center justify-between">
        <h1 className="text-xl font-semibold">Controle Financeiro Pessoal</h1>
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded border border-border p-6">
        <p>
          Logado como <span className="font-medium">{data.user.email}</span>.
        </p>
        <p className="mt-2 text-sm text-fg/70">
          As telas de Parâmetros, Dívidas, Controladoria, Fluxo de Caixa e Investimentos chegam
          nos próximos passos.
        </p>
        <form action={signOut} className="mt-4">
          <button
            type="submit"
            className="rounded border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Verify the full flow live in the browser**

Requires Task 3's migration to already be applied (its checkpoint). Run `npm run dev` and, in
the browser:
1. Visit `http://localhost:3000` — expect a redirect to `/login`.
2. Go to `/signup`, create an account with a real email you can check.
3. Depending on the Supabase project's "Confirm email" auth setting (enabled by default):
   confirm via the email link, then log in at `/login`; or if the user disabled that setting
   for easier testing, log in immediately.
4. After logging in, confirm you land on `/` and see "Logado como &lt;email&gt;".
5. Click "Sair" — confirm you're redirected to `/login`.
6. Ask the user to check, in the Supabase SQL Editor, `select count(*) from public.categories;`
   — expect `10` (the defaults inserted by the `handle_new_user` trigger from Task 3), confirming
   schema, RLS, and trigger are all wired correctly end-to-end.

- [ ] **Step 8: Commit**

```bash
git add app/login app/signup app/actions.ts app/page.tsx
git commit -m "Add signup, login, logout, and protected home page"
```

---

### Task 6: README and first deploy

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# Controle Financeiro Pessoal

Plataforma pessoal de controle financeiro — substitui a planilha "Personal Finance.xlsx".
Ver `spec/` para o produto e `docs/superpowers/specs/` para as decisões técnicas.

## Desenvolvimento local

1. `npm install`
2. Crie `.env.local` (não versionado) a partir de `.env.local.example`, com a Project URL e a
   anon key do projeto Supabase.
3. `npm run dev` e abra `http://localhost:3000`.

## Banco de dados

O schema (tabelas + RLS + trigger de novo usuário) vive em `supabase/migrations/`. Cada arquivo
é aplicado colando seu conteúdo no SQL Editor do painel do Supabase — nenhuma senha de banco ou
service role key é necessária para isso.

## Deploy

1. `git push` para o repositório no GitHub.
2. Na Vercel, importar esse repositório.
3. Cadastrar as env vars `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em
   Project Settings → Environment Variables.
4. Cada push subsequente gera um novo deploy automático.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Add README with setup and deploy instructions"
```

- [ ] **Step 3: CHECKPOINT — confirm before pushing to GitHub**

Ask the user to explicitly confirm before running the push in the next step (pushing code is a
shared-state action that always needs confirmation, per the assistant's operating rules) —
confirm the target repository URL (e.g. `https://github.com/Claytonjosev-hub/PersonalFinanceClaytonJoseV`)
and that it's the intended destination.

- [ ] **Step 4: Add the remote and push (only after Step 3's confirmation)**

```bash
git remote add origin <confirmed-repo-url>
git branch -M main
git push -u origin main
```

- [ ] **Step 5: Guide the user through the Vercel dashboard steps**

No code — talk the user through:
1. vercel.com → "Add New" → "Project" → import the GitHub repository just pushed.
2. In the import screen's Environment Variables section, add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the same values from `.env.local`.
3. Deploy.

- [ ] **Step 6: Verify the live deployment**

Once Vercel reports the deploy is live, open the production URL and repeat Task 5 Step 7's
signup/login/logout flow against production. Confirm it behaves identically to local dev.
