# Plataforma de Controle Financeiro Pessoal — Especificação para desenvolvimento

> Rascunho v1 — para revisar e ajustar antes de enviar ao Claude Code para implementação.
> Origem: migração da planilha "Personal Finance.xlsx" (abas Parâmetros, Dívidas e Parcelas, Controladoria, Fluxo de Caixa).

## 1. Objetivo

Substituir a planilha atual por uma aplicação web real que elimina o principal problema do modelo em Excel: valores que deveriam ser fórmulas acabam sendo digitados por cima (hoje a aba Fluxo de Caixa já está marcada como "Divergente" em agosto/26 por causa disso). A plataforma deve ter **uma única fonte de dados** por trás de todas as telas, para que "Controladoria" (visão mensal) e "Fluxo de Caixa" (visão diária) sejam sempre, matematicamente, a mesma informação vista em duas granularidades — nunca precisando de conferência manual.

Dois usuários (Clayton e sua namorada), cada um com login próprio e dados **totalmente isolados** um do outro (sem visão consolidada de casal por enquanto).

## 2. Stack técnica

- **Frontend + backend**: Next.js (App Router), deployado na **Vercel**.
- **Banco de dados + autenticação**: **Supabase** (Postgres gerenciado + Supabase Auth + Row Level Security).
- Todas as tabelas usam RLS por `user_id` = `auth.uid()`, garantindo isolamento total entre os dois usuários sem precisar de lógica extra no app.

## 3. Princípio de arquitetura (o que muda em relação à planilha)

Em vez de replicar as 4 abas como blocos de dados separados e semi-independentes (como no Excel), o sistema terá:

1. **Um razão único de lançamentos** (`transactions`): toda movimentação financeira — receita ou despesa, automática (vinda de dívida/parcela) ou manual — vive aqui, com data, valor, categoria e forma de pagamento.
2. **Motor de projeção**: um serviço/função que, a partir dos parâmetros, das dívidas cadastradas e das despesas fixas, **gera automaticamente** as parcelas futuras como lançamentos projetados (sem precisar digitar mês a mês).
3. **Telas de visualização, não de dados**: "Controladoria" (mensal) e "Fluxo de Caixa" (diário) são apenas agregações/consultas diferentes sobre o mesmo razão — nunca dados duplicados e nunca podem divergir entre si.

## 4. Modelo de dados (rascunho)

Todas as tabelas abaixo têm `user_id` (FK para o usuário autenticado) e RLS habilitado.

### `parameters` (1 registro por usuário)
- `start_month` (date) — mês inicial do sistema
- `projection_months` (int) — nº de meses projetados (hoje 17)
- `initial_balance` (numeric) — saldo inicial em caixa
- `salary_day` (int) — dia de recebimento do salário

### `payment_methods` (cartões e formas de pagamento)
- `id`, `name` (ex: "Cartão Itaú", "Cartão BTG", "Cartão Nubank", "Débito/Pix", "Financiamento")
- `due_day` (int, nullable) — dia de vencimento da fatura

### `recurring_incomes` (receitas mensais padrão)
- `description` (ex: "Salário líquido", "Bonificação")
- `amount`

### `recurring_expenses` (despesas fixas mensais)
- `description`, `payment_method_id`, `amount`

### `debts` (dívidas e parcelamentos — cadastro único, igual à planilha)
- `description`, `payment_method_id`, `category` (Compras Parceladas / Serviço-Mensalidade / Parcelamento Fatura CC / Financiamento do Carro)
- `installment_amount` (valor da parcela)
- `total_installments` (int, nullable = recorrente sem fim)
- `first_installment_date`
- `status` (Ativa / Quitada / Recorrente)
- **Calculado em consulta, nunca armazenado**: última parcela, valor total, parcelas restantes, saldo devedor — evita exatamente o tipo de inconsistência que existe hoje na planilha.

### `debts_without_schedule` (dívidas sem cronograma definido)
- `description`, `creditor`, `open_balance`, `notes` (ex: caso "Dívida RBC")

### `transactions` (razão único — receitas e despesas manuais/pontuais)
- `date`, `type` (receita/despesa), `category`, `amount`, `payment_method_id`, `notes`
- Cobre o que hoje é digitado manualmente: outras receitas, supermercado, alimentação, saídas/lazer, outros gastos por cartão, gastos diários avulsos.

### `investments`
- `type` (Renda Fixa / Renda Variável / Reserva de Emergência)
- `description`, `institution`
- `invested_amount`, `current_amount`
- `rate` (taxa, ex: "110% CDI"), `index_type` (CDI/IPCA/Prefixado, quando aplicável)
- `liquidity` (ex: "Diária", "No vencimento", "D+30")
- `grace_period` (carência, quando aplicável)
- `applied_at`, `maturity_at` (nullable para reserva de emergência / renda variável)
- Campos específicos de renda variável (ticker, quantidade, preço médio) podem entrar como colunas nullable ou tabela auxiliar `investment_positions` — a definir na hora de programar.

## 5. Telas / abas da plataforma

1. **Dashboard** — resumo geral: saldo atual, saldo projetado, patrimônio líquido (investimentos − dívidas), alertas do mês. *(Fase 2 para os gráficos completos; Fase 1 pode ter uma versão simples em números.)*
2. **Parâmetros** — configuração geral, cartões, receitas padrão, despesas fixas.
3. **Dívidas e Parcelamentos** — cadastro de dívidas + cronograma calculado automaticamente + total comprometido por forma de pagamento.
4. **Controladoria** — visão mensal (receitas x despesas x resultado x indicadores), para os N meses projetados.
5. **Fluxo de Caixa** — visão diária, mês a mês, saldo dia a dia.
6. **Investimentos** — cadastro e acompanhamento de renda fixa, renda variável e reserva de emergência.

## 6. Fases de entrega

### Fase 1 — Base funcional (prioridade)
- Autenticação (login individual, dados isolados por usuário)
- Migração dos dados atuais da planilha para o banco (parâmetros, dívidas cadastradas, saldo inicial)
- Telas: Parâmetros, Dívidas e Parcelamentos, Controladoria, Fluxo de Caixa, Investimentos — todas funcionando de forma 100% automática e consistente entre si
- Lançamento manual de receitas/despesas avulsas e investimentos

### Fase 2 — Camada de análise e conveniência
- Dashboards e gráficos (evolução de saldo, % da renda comprometida, dívida por credor, patrimônio líquido ao longo do tempo)
- Alertas/notificações (fatura vencendo, saldo projetado ficando negativo, meta de gasto estourada)
- Importação de extrato/fatura via upload de CSV (mapeamento de colunas → categorização de lançamentos)

### Fora de escopo por enquanto (backlog futuro)
- Integração automática via Open Finance (Pluggy/Belvo) — decidiu-se começar manual/CSV por custo e complexidade
- Visão consolidada de casal — hoje os dados ficam totalmente separados entre os dois usuários

## 7. Pontos em aberto para revisarmos juntos antes de enviar ao Claude Code

- Confirmar a lista exata de categorias de despesa (hoje: Compras Parceladas, Assinaturas/Mensalidades, Supermercado, Alimentação, Saídas e Lazer, "Outros" por cartão, Despesas Fixas, Outras Despesas) — manter fixas ou permitir categorias customizáveis?
- Layout/estilo visual desejado (cores, modo escuro, etc.) — pode ficar a critério do Claude Code ou você tem preferência?
- Formato exato do CSV de extrato/fatura que pretende importar na Fase 2 (banco/cartão de origem), para desenhar o parser certo quando chegar a hora.
- Nome da plataforma (para título, domínio, etc.).
