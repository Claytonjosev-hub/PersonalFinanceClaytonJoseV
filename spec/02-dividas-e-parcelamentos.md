# Aba: Dívidas e Parcelamentos

> Documento 3 de 6. Pressupõe o modelo de dados e o design system definidos em `00-logica-central-e-geral.md`.

## Propósito

Cadastro único de cada dívida/parcelamento. O cronograma de parcelas, o saldo devedor e as parcelas restantes nunca são digitados — são sempre calculados a partir do cadastro, resolvendo o problema que existia na planilha (esses valores lá eram fórmulas que podiam ser sobrescritas).

## Seções da tela

### 1. Cadastro de dívidas
Formulário/tabela sobre `debts`, com os campos:
- Descrição (ex: "Financiamento BYD", "Tênis On Cloudrunner 3")
- Credor / forma de pagamento (`payment_methods`)
- Categoria (`categories` — ex: Compras Parceladas, Serviço/Mensalidade, Parcelamento de Fatura, Financiamento)
- Valor da parcela
- Nº total de parcelas (campo aceita número OU a marcação "Recorrente" para assinaturas/planos sem fim, ex: Apple One, Wellhub)
- Data da 1ª parcela

Campos **calculados e exibidos, nunca editáveis diretamente**:
- Última parcela (1ª parcela + nº de parcelas − 1 mês; "Recorrente" se não houver fim definido)
- Valor total (valor da parcela × nº de parcelas; vazio se recorrente)
- Parcelas restantes (com base no mês atual do sistema)
- Saldo devedor (parcelas restantes × valor da parcela)
- Status: "Ativa" enquanto houver parcelas restantes > 0 ou for recorrente; "Quitada" quando parcelas restantes chegar a 0 automaticamente

### 2. Cronograma de parcelas (automático)
Visão em grade: linhas = meses do eixo definido em Parâmetros, colunas = cada dívida ativa, células = valor da parcela devida naquele mês (0 se não há parcela naquele mês para aquela dívida).
- Gerado inteiramente por cálculo a partir do cadastro (data da 1ª parcela + nº de parcelas), nunca digitado.
- É a partir dessa grade que o motor de projeção (seção 3 do documento central) alimenta `transactions` como lançamentos automáticos de despesa (`source = 'auto_debt'`).

### 3. Total mensal por forma de pagamento
Tabela resumo: para cada mês do eixo, soma das parcelas daquele mês agrupadas por `payment_method` (Cartão Itaú, Cartão BTG, Cartão Nubank, Financiamento, Débito/Pix) + total geral do mês.

### 4. Total comprometido por forma de pagamento
Para cada forma de pagamento, soma do saldo devedor de todas as dívidas ativas vinculadas a ela, mais o total geral de endividamento em cronograma.

### 5. Dívidas sem cronograma definido
CRUD sobre `debts_without_schedule`: descrição, credor, saldo em aberto, observação (ex: dívida em negociação, ainda sem parcelas definidas). Some no card de "Endividamento total" junto com o total comprometido da seção 4.

## Regras de negócio

- Dívida marcada como "Recorrente" nunca fica "Quitada" automaticamente — só quando o usuário mudar o status manualmente (ex: cancelou a assinatura).
- Editar uma dívida existente (ex: corrigir valor da parcela) deve recalcular o cronograma inteiro dela, sem deixar "resíduo" de valores antigos em meses passados.
- Excluir uma dívida deve remover seus lançamentos automáticos futuros, mas idealmente manter histórico de lançamentos passados já ocorridos (a definir com o Claude Code o melhor tratamento: exclusão lógica vs. física).
