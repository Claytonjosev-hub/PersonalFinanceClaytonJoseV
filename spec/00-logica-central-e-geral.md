# Controle Financeiro Pessoal — Lógica Central e Geral

> Documento 1 de 6. Este arquivo é a base: arquitetura, stack, modelo de dados, design system e fases.
> Os outros 5 arquivos (um por aba) assumem tudo que está definido aqui e não repetem os detalhes técnicos gerais.

## 1. Objetivo

Substituir a planilha atual ("Personal Finance.xlsx" — abas Parâmetros, Dívidas e Parcelas, Controladoria, Fluxo de Caixa) por uma aplicação web chamada **Controle Financeiro Pessoal**, que elimina o principal problema do modelo em Excel: valores que deveriam ser fórmulas acabam sendo digitados por cima (hoje a aba Fluxo de Caixa da planilha já está marcada como "Divergente" em agosto/26 por causa disso).

Dois usuários (Clayton e sua namorada), cada um com login próprio e dados **totalmente isolados** um do outro — sem visão consolidada de casal por enquanto.

## 2. Stack técnica

- **Frontend + backend**: Next.js (App Router, TypeScript), deployado na **Vercel**.
- **Banco de dados + autenticação**: **Supabase** (Postgres gerenciado + Supabase Auth + Row Level Security).
- **Estilo**: Tailwind CSS (ou CSS Modules com CSS variables) — o que o Claude Code achar mais produtivo, desde que suporte o design system da seção 5.
- Todas as tabelas usam RLS por `user_id = auth.uid()`, garantindo isolamento total entre os dois usuários sem lógica extra no app.

### 2.1 Setup Supabase + Vercel (passo a passo operacional)

1. No Supabase, criar um novo projeto (região São Paulo se disponível), guardar a senha do banco.
2. Em Project Settings → API, copiar `Project URL` e `anon public key`.
3. Subir o código do projeto Next.js para um repositório no GitHub.
4. Na Vercel, "Add New → Project" e importar esse repositório.
5. Conectar a integração oficial Supabase↔Vercel (ou cadastrar manualmente as env vars `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em Project Settings → Environment Variables da Vercel, usando os valores do passo 2).
6. Deploy. Cada push no GitHub gera um novo deploy automático.
7. Rodar as migrations do banco (schema da seção 4) via Supabase CLI ou SQL editor do próprio Supabase antes do primeiro uso.

## 3. Princípio de arquitetura (o que muda em relação à planilha)

Em vez de replicar as abas como blocos de dados separados e semi-independentes (como no Excel), o sistema tem:

1. **Um razão único de lançamentos** (`transactions`): toda movimentação financeira — receita ou despesa, automática (vinda de dívida/parcela/despesa fixa) ou manual/importada — vive aqui, com data, valor, categoria e forma de pagamento.
2. **Motor de projeção**: uma função/serviço que, a partir dos parâmetros, das dívidas cadastradas e das despesas fixas, **gera automaticamente** as parcelas futuras como lançamentos projetados — nunca digitados mês a mês à mão.
3. **Telas de visualização, não de dados**: Controladoria (mensal) e Fluxo de Caixa (diário) são apenas agregações/consultas diferentes sobre o mesmo razão. Elas **nunca podem divergir entre si** porque não existem "dois lugares" guardando o mesmo número — existe um cálculo só, mostrado em duas granularidades.

Isso substitui a lógica de fórmula do Excel (que quebra quando alguém digita por cima) por cálculo feito sempre em tempo de consulta (view/query no banco ou função no backend), nunca armazenado como snapshot.

## 4. Modelo de dados (rascunho)

Todas as tabelas abaixo têm `user_id` (FK para `auth.users`) e RLS habilitado (usuário só lê/escreve suas próprias linhas).

### `parameters` (1 registro por usuário)
- `start_month` (date) — mês inicial do sistema
- `projection_months` (int) — nº de meses projetados (hoje 17)
- `initial_balance` (numeric) — saldo inicial em caixa
- `salary_day` (int) — dia de recebimento do salário
- `theme_preference` (enum: light / dark / system)

### `payment_methods` (cartões e formas de pagamento — editável pelo usuário)
- `id`, `name` (ex: "Cartão Itaú", "Cartão BTG", "Cartão Nubank", "Débito/Pix", "Financiamento")
- `due_day` (int, nullable) — dia de vencimento da fatura
- `color` (hex, opcional, para identificação visual nas telas)

### `categories` (editável pelo usuário — substitui as categorias fixas da planilha)
- `id`, `name`, `type` (receita / despesa)
- `color` (hex, para tags/gráficos)
- `is_default` (bool) — marca as categorias que vêm pré-cadastradas na primeira vez (Supermercado, Alimentação, Saídas e Lazer, Assinaturas e Mensalidades, Compras Parceladas, Outros, Despesas Fixas, Outras Receitas), todas editáveis/removíveis depois
- CRUD completo: usuário pode criar, renomear, recolorir e arquivar categorias a qualquer momento; lançamentos antigos mantêm a referência mesmo se a categoria for arquivada

### `recurring_incomes` (receitas mensais padrão)
- `description` (ex: "Salário líquido", "Bonificação"), `amount`

### `recurring_expenses` (despesas fixas mensais)
- `description`, `payment_method_id`, `category_id`, `amount`, `due_day` (opcional)

### `debts` (dívidas e parcelamentos — cadastro único, igual à planilha)
- `description`, `payment_method_id`, `category_id`
- `installment_amount` (valor da parcela)
- `total_installments` (int, nullable = recorrente sem fim)
- `first_installment_date`
- `status` (Ativa / Quitada / Recorrente — calculado automaticamente quando possível)
- **Calculado em consulta, nunca armazenado**: última parcela, valor total, parcelas restantes, saldo devedor.

### `debts_without_schedule` (dívidas sem cronograma definido)
- `description`, `creditor`, `open_balance`, `notes` (ex: caso real de dívida em negociação sem parcelas definidas ainda)

### `transactions` (razão único — receitas e despesas manuais/pontuais/importadas)
- `date`, `type` (receita/despesa), `category_id`, `amount`, `payment_method_id`, `notes`
- `source` (manual / import_csv / auto_debt / auto_recurring) — permite saber a origem de cada linha
- Cobre o que hoje é digitado manualmente na planilha: outras receitas, supermercado, alimentação, saídas/lazer, outros gastos por cartão, gastos diários avulsos — e também o que vier de importação de CSV.

### `investments`
- `type` (Renda Fixa / Renda Variável / Reserva de Emergência)
- `description`, `institution`
- `invested_amount`, `current_amount`
- `rate` (taxa, ex: "110% CDI"), `index_type` (CDI/IPCA/Prefixado, quando aplicável)
- `liquidity` (ex: "Diária", "No vencimento", "D+30")
- `grace_period` (carência, quando aplicável)
- `applied_at`, `maturity_at` (nullable)
- Detalhamento completo dos campos por tipo está no arquivo `05-investimentos.md`.

## 5. Design system

- **Modo claro e escuro**: suportar os dois, com alternância manual (ícone de sol/lua) além de respeitar a preferência do sistema operacional por padrão. Implementar via CSS variables (ou tokens do Tailwind) para todas as cores, nunca cor "hardcoded" em componente.
- **Paleta minimalista**: base neutra (tons de cinza/branco no claro, cinza muito escuro/quase preto no escuro), uma única cor de destaque (accent) para ações e elementos de foco, e duas cores semânticas — uma para "positivo/OK" (ex: verde) e uma para "negativo/alerta" (ex: vermelho/laranja) usadas em saldo, indicadores e alertas.
- **Tipografia**: fonte sans-serif limpa, hierarquia clara (títulos, corpo, dados numéricos em fonte tabular para alinhar valores em tabelas).
- **Espaçamento generoso**, cantos suavemente arredondados, sombras discretas — evitar poluição visual, priorizar leitura rápida dos números.
- Todas as telas devem funcionar bem tanto no claro quanto no escuro sem retrabalho — isso deve ser parte do design system desde o primeiro componente, não um ajuste posterior.

## 6. Importação de extrato/fatura via CSV

- Usuário faz upload de um arquivo `.csv` (aceitar separador vírgula ou ponto e vírgula, datas em `dd/mm/aaaa` ou `aaaa-mm-dd`, valores com vírgula ou ponto decimal).
- Tela de **preview**: mostra as linhas interpretadas antes de confirmar, com mapeamento de colunas (data, descrição, valor e — se existir no arquivo — categoria/forma de pagamento) que o usuário pode ajustar manualmente caso o cabeçalho do banco não bata automaticamente.
- Usuário atribui/confirma a categoria de cada lançamento (ou em lote) antes de importar.
- Ao confirmar, as linhas entram em `transactions` com `source = 'import_csv'`.
- Sem integração automática por API bancária nesta fase (ver seção 7) — só upload manual de arquivo.

## 7. Fases de entrega

### Fase 1 — Base funcional (prioridade)
- Autenticação (login individual, dados isolados por usuário)
- Migração dos dados atuais da planilha para o banco (parâmetros, dívidas cadastradas, saldo inicial) como carga inicial
- Design system (claro/escuro, paleta minimalista) implementado desde o início
- Categorias e formas de pagamento editáveis (CRUD)
- Telas: Parâmetros, Dívidas e Parcelamentos, Controladoria, Fluxo de Caixa, Investimentos — todas funcionando de forma automática e sempre consistentes entre si
- Lançamento manual de receitas/despesas avulsas e investimentos
- Importação de CSV (seção 6)

### Fase 2 — Camada de análise e conveniência
- Dashboard com gráficos (evolução de saldo, % da renda comprometida, dívida por credor, patrimônio líquido ao longo do tempo) — **parcialmente entregue em 2026-08-27** (ver `docs/superpowers/plans/2026-08-27-visual-redesign-home-dashboard-mobile.md`, Task 2): a tela Início hoje mostra saldo atual, disponível para gastar até o próximo salário, total em dívidas e os recebimentos/pagamentos dos próximos 30 dias — tudo sem gráfico e sem série histórica. A evolução de saldo/patrimônio ao longo do tempo, % renda comprometida em série e dívida por credor continuam em aberto.
- Alertas/notificações (fatura vencendo, saldo projetado ficando negativo, meta de gasto estourada)

### Fora de escopo por enquanto (backlog futuro)
- Integração automática via Open Finance (Pluggy/Belvo) — decidido começar manual/CSV por custo e complexidade
- Visão consolidada de casal — hoje os dados ficam totalmente separados entre os dois usuários

## 8. Pontos em aberto (nenhum bloqueante — Claude Code pode assumir defaults razoáveis e seguir)

- Formato exato do CSV do banco/cartão que você pretende importar primeiro — o parser pode começar genérico e ser ajustado no primeiro teste real.
- Estrutura de pastas do projeto Next.js — fica a critério de quem for programar, seguindo boas práticas do framework.
