# Controle Financeiro Pessoal — Design técnico de implementação

> Complementa (não substitui) o produto especificado em `spec/00-logica-central-e-geral.md` até
> `spec/05-investimentos.md`. Aqueles arquivos definem **o quê** construir (modelo de dados, telas,
> regras de negócio). Este documento define **como** construir: stack, arquitetura de código,
> mecanismo de deploy e decisões que os specs deixaram a critério de quem programar.
>
> `spec-plataforma-financeira.md` (raiz) é o rascunho v1, substituído pelos 6 arquivos em `spec/`.

## 1. Stack e estrutura do repositório

- Next.js 15 (App Router, TypeScript), Tailwind CSS, deploy na Vercel.
- Autenticação e dados: Supabase (Postgres + Supabase Auth + RLS), acesso via `@supabase/ssr` +
  `@supabase/supabase-js`.
- Repositório único, Next.js na raiz do projeto (mesma pasta dos arquivos `spec/`).
- Project ref do Supabase: `xmjzdqzrcfiovkqonffu` (extraído da Project URL fornecida).

## 2. Motor de projeção (ledger engine)

Implementado como módulo TypeScript puro (`lib/ledger.ts`), não como views/functions SQL.

- Recebe os dados brutos (`parameters`, `debts`, `recurring_incomes`, `recurring_expenses`,
  `transactions`) já filtrados por `user_id` (RLS garante isso na query) e retorna o razão
  projetado completo: uma lista de lançamentos (reais + projetados) para os N meses definidos em
  `parameters.projection_months`.
- Controladoria (agregação mensal) e Fluxo de Caixa (agregação diária) chamam a **mesma função**,
  apenas agregando o resultado em granularidades diferentes. Isso é o que garante, por construção,
  que as duas telas nunca divirjam — não existem duas consultas independentes que possam calcular
  valores diferentes.
- Motivo de ser TS em vez de SQL: volume de dados é pequeno (uso pessoal, 2 usuários), e funções
  puras em TypeScript são muito mais fáceis de testar e depurar do que SQL com `generate_series`
  sobre datas e parcelas.

## 3. Autenticação

- Supabase Auth, e-mail/senha. Telas de signup e login (self-service — cada usuário cria a própria
  conta).
- Trigger `on auth.users insert` (função `SECURITY DEFINER`) cria automaticamente, para qualquer
  novo usuário: 1 registro em `parameters` com defaults razoáveis, e as categorias padrão listadas
  em `spec/01-parametros.md` (receita: Salário, Bonificação, Outras Receitas; despesa: Compras
  Parceladas, Assinaturas e Mensalidades, Supermercado, Alimentação, Saídas e Lazer, Despesas
  Fixas, Outras Despesas).
- Isso garante que a namorada do Clayton, ao se cadastrar, já tem uma base funcional mesmo sem
  migração de planilha.

## 4. Schema do banco: entrega via SQL Editor, não via CLI

A anon key fornecida não tem permissão para DDL (`CREATE TABLE`, políticas de RLS) — isso exige
acesso elevado ao Postgres (senha do banco ou service role key), que não será solicitado nem
compartilhado nesta conversa por segurança.

Mecanismo escolhido: dois arquivos `.sql` gerados durante a implementação, para colar no **SQL
Editor do painel do Supabase**:

1. `supabase/migrations/001_schema_and_rls.sql` — as 8 tabelas do modelo de dados (`parameters`,
   `payment_methods`, `categories`, `recurring_incomes`, `recurring_expenses`, `debts`,
   `debts_without_schedule`, `transactions`, `investments`), políticas de RLS
   (`user_id = auth.uid()`) e o trigger de novo usuário (seção 3). Roda uma vez, antes do primeiro
   deploy.
2. Um segundo script, gerado a partir de `Personal Finance (1).xlsx`, com os dados reais do
   Clayton (parâmetros, dívidas, receitas/despesas fixas, saldo inicial). Roda uma vez, **depois**
   do Clayton criar sua conta no app já em produção (o script localiza o `user_id` pelo e-mail).
   **Este arquivo não é versionado no git** (contém valores financeiros reais) — fica fora do
   repositório, só na máquina local, e é excluído após o uso.

O Supabase CLI já está instalado localmente e pode ser usado depois, no dia a dia, para
`db pull`/geração de tipos — mas não para aplicar o schema inicial, evitando lidar com a senha do
banco.

## 5. Importação de CSV

Route handler em Next.js que faz o parsing do arquivo enviado (vírgula ou ponto e vírgula como
separador, datas em `dd/mm/aaaa` ou `aaaa-mm-dd`), mostra tela de preview com mapeamento de
colunas ajustável, e insere em `transactions` com `source = 'import_csv'` só após confirmação —
exatamente como descrito em `spec/00-logica-central-e-geral.md §6`.

## 6. Pipeline de deploy

1. App é construído e commitado localmente neste repositório.
2. Clayton cria (ou já criou) o repositório no GitHub e compartilha a URL.
3. Antes de qualquer `git push`, confirmação explícita do Clayton.
4. Clayton importa o repositório na Vercel (dashboard) e cadastra as env vars
   `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (valores já compartilhados nesta
   conversa — são chaves públicas, seguras para o client-side).
5. Cada push subsequente gera um novo deploy automático na Vercel.

## 7. Dados sensíveis — o que não entra no controle de versão

- `Personal Finance (1).xlsx` — permanece fora do git (`.gitignore`).
- O script de seed com os dados reais do Clayton (seção 4, item 2) — gerado localmente, nunca
  commitado.
- Nenhuma senha de banco, service role key ou token de acesso é solicitado ao usuário ou
  manipulado por este processo.

## 8. Fora de escopo (confirma `spec/00 §7`)

Fase 2 completa (dashboards com gráficos, alertas/notificações) e integrações Open
Finance/visão de casal permanecem fora do escopo desta implementação. O alvo desta entrega é a
Fase 1 completa, com deploy funcional.
