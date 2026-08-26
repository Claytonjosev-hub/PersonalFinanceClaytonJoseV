-- 002_import_parametros_data.sql
-- Importa os dados reais da aba "Parâmetros" da planilha antiga
-- (Personal Finance — Parâmetros.csv) para a conta de claytonjosev@icloud.com.
--
-- Seguro para rodar mais de uma vez: cada INSERT verifica se o registro já
-- existe antes de inserir, e o UPDATE de parameters é idempotente por
-- natureza (só reflete os valores mais recentes).
--
-- Rodar no SQL Editor do Supabase, projeto xmjzdqzrcfiovkqonffu.

do $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = 'claytonjosev@icloud.com';

  if v_user_id is null then
    raise exception 'Nenhum usuário encontrado com o e-mail claytonjosev@icloud.com. Confirme o e-mail cadastrado no Supabase Auth (Authentication → Users) e ajuste esta linha antes de rodar novamente.';
  end if;

  -- 1. Configuração geral -------------------------------------------------
  -- Mês inicial: ago.-26 · Nº de meses projetados: 17
  -- Saldo inicial em caixa: "–" na planilha (não preenchido) → 0, ajuste
  -- manualmente em /parametros se o saldo real de caixa em ago/26 for outro.
  -- Dia de recebimento do salário: 1
  update public.parameters
  set
    start_month = '2026-08-01',
    projection_months = 17,
    initial_balance = 0,
    salary_day = 1
  where user_id = v_user_id;

  -- 2. Cartões e formas de pagamento (vencimentos da planilha) ------------
  if not exists (select 1 from public.payment_methods where user_id = v_user_id and name = 'Cartão Itaú') then
    insert into public.payment_methods (user_id, name, due_day) values (v_user_id, 'Cartão Itaú', 5);
  end if;

  if not exists (select 1 from public.payment_methods where user_id = v_user_id and name = 'Cartão BTG') then
    insert into public.payment_methods (user_id, name, due_day) values (v_user_id, 'Cartão BTG', 5);
  end if;

  if not exists (select 1 from public.payment_methods where user_id = v_user_id and name = 'Cartão Nubank') then
    insert into public.payment_methods (user_id, name, due_day) values (v_user_id, 'Cartão Nubank', 7);
  end if;

  -- 3. Receitas mensais padrão ---------------------------------------------
  -- Total da planilha: R$2.800,00 (2.500 + 300) — bate com a soma abaixo.
  if not exists (select 1 from public.recurring_incomes where user_id = v_user_id and description = 'Salário líquido') then
    insert into public.recurring_incomes (user_id, description, amount) values (v_user_id, 'Salário líquido', 2500.00);
  end if;

  if not exists (select 1 from public.recurring_incomes where user_id = v_user_id and description = 'Bonificação') then
    insert into public.recurring_incomes (user_id, description, amount) values (v_user_id, 'Bonificação', 300.00);
  end if;

  -- 4. Despesas fixas mensais -----------------------------------------------
  -- A seção "3. DESPESAS FIXAS MENSAIS" do CSV está vazia (sem linhas
  -- preenchidas na planilha) — nada para importar aqui. Cadastre manualmente
  -- em /parametros quando tiver essa lista, ou me envie o CSV correspondente
  -- (aba de despesas fixas, se existir separada) para eu gerar o import.

  raise notice 'Importação de Parâmetros concluída para user_id %', v_user_id;
end $$;
