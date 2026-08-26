# Controle Financeiro Pessoal

Plataforma pessoal de controle financeiro — substitui a planilha "Personal Finance.xlsx".
Ver `spec/` para o produto e `docs/superpowers/specs/` para as decisões técnicas.

## Desenvolvimento local

1. `npm install`
2. Crie `.env.local` (não versionado) a partir de `.env.local.example`, com a Project URL e a
   anon key do projeto Supabase.
3. `npm run dev` e abra `http://localhost:3000`.

## Contas de usuário

Não há cadastro self-service (`/signup`) — o app é de uso pessoal (Clayton e sua parceira).
Novas contas são criadas diretamente no painel do Supabase, em Authentication → Users → Add
user, com a opção "Auto Confirm User" marcada (evita o rate limit de e-mail de confirmação do
plano gratuito do Supabase).

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
