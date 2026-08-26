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
