# Aba: Parâmetros

> Documento 2 de 6. Pressupõe o modelo de dados e o design system definidos em `00-logica-central-e-geral.md`.

## Propósito

Painel único de configuração geral do sistema. É a aba que menos muda no dia a dia, mas alimenta todas as outras (Dívidas, Controladoria, Fluxo de Caixa).

## Seções da tela

### 1. Configuração geral
Formulário editando a tabela `parameters` (1 registro por usuário):
- Mês inicial do sistema
- Nº de meses projetados (define quantos meses aparecem em Controladoria e Fluxo de Caixa)
- Saldo inicial em caixa
- Dia de recebimento do salário

### 2. Cartões e formas de pagamento
CRUD sobre `payment_methods`:
- Lista editável (adicionar, renomear, remover, definir dia de vencimento, cor)
- Hoje existem 3 cartões (Itaú, BTG, Nubank) + Financiamento + Débito/Pix, mas o usuário deve poder adicionar novas formas de pagamento livremente (ex: um cartão novo, outro financiamento)

### 3. Categorias
CRUD sobre `categories` (ver seção 4 de `00-logica-central-e-geral.md`):
- Duas listas (ou uma lista com filtro): categorias de receita e categorias de despesa
- Cada categoria: nome, cor, tipo
- Categorias padrão pré-carregadas na primeira vez que o usuário usa o sistema: Salário, Bonificação, Outras Receitas (receita); Compras Parceladas, Assinaturas e Mensalidades, Supermercado, Alimentação, Saídas e Lazer, Despesas Fixas, Outras Despesas (despesa)
- Usuário pode editar nome/cor, criar novas, e arquivar (não excluir de vez) categorias que não usa mais — lançamentos antigos continuam mostrando a categoria original mesmo se arquivada

### 4. Receitas mensais padrão
CRUD sobre `recurring_incomes`:
- Ex: "Salário líquido", "Bonificação", com valor mensal
- Soma automática exibida como "Total de receitas padrão / mês"
- Esse total alimenta a linha "Receitas" da Controladoria todo mês, sem precisar redigitar

### 5. Despesas fixas mensais (assinaturas e recorrentes)
CRUD sobre `recurring_expenses`:
- Descrição, forma de pagamento, categoria, valor mensal
- Soma automática exibida como "Total de despesas fixas"
- Alimenta automaticamente Controladoria e Fluxo de Caixa todo mês

### 6. Eixo de meses (somente leitura)
- Lista os N meses do sistema (calculado a partir de mês inicial + nº de meses projetados), só para conferência visual — não editável.

## Regras de negócio

- Alterar "nº de meses projetados" deve recalcular automaticamente o intervalo mostrado em Controladoria e Fluxo de Caixa, sem precisar duplicar blocos manualmente (diferente da planilha, onde isso exigia replicar colunas à mão).
- Nenhum valor aqui deve ser "congelado": qualquer alteração em receita padrão ou despesa fixa deve refletir imediatamente nos meses futuros recalculados (mas não deve alterar lançamentos passados já registrados manualmente).
