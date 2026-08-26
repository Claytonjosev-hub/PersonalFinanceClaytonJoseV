# Aba: Fluxo de Caixa

> Documento 5 de 6. Pressupõe o modelo de dados e o design system definidos em `00-logica-central-e-geral.md`.

## Propósito

Visão diária, mês a mês, do saldo em caixa projetado. Assim como a Controladoria, **não guarda dados próprios** — é a mesma fonte (`transactions` + cronograma de dívidas + despesas fixas) agregada por dia em vez de por mês. Por construção, o total de um mês aqui é sempre idêntico ao daquele mês na Controladoria — não existe mais a checagem manual "Conferência vs. Controladoria" que existia na planilha, porque não há como divergir.

## Estrutura da tela (por dia, dentro de cada mês)

Para cada dia do mês, colunas:
- **Receitas automáticas**: cai no dia configurado como "dia de recebimento do salário" (Parâmetros), somando receitas padrão do mês
- **Receitas manuais**: lançamentos avulsos de receita naquele dia específico
- **Faturas/parcelas automáticas**: cai no dia de vencimento de cada forma de pagamento (`payment_methods.due_day`), somando o total da fatura daquele cartão naquele mês (vindo do cronograma de dívidas + despesas fixas vinculadas àquele cartão)
- **Despesas manuais**: lançamentos avulsos de despesa (não ligados a fatura) naquele dia
- **Gastos diários**: pequenos lançamentos do dia a dia (ex: compras no débito/pix)
- **Saldo**: saldo do dia anterior + receitas do dia − despesas do dia (acumulado, começando do saldo inicial de Parâmetros no primeiro dia do sistema)

### Totais do mês (rodapé)
- Soma de cada coluna ao longo dos dias do mês
- Resultado do mês (igual ao valor mostrado na Controladoria para o mesmo mês)

## Navegação
- Um mês visível por vez (com navegação entre os N meses do eixo), em vez dos blocos lado a lado gigantes da planilha — melhora legibilidade, especialmente em telas menores.

## Regras de negócio

- Lançar uma receita ou despesa manual em qualquer tela do sistema (ex: pela Controladoria ou por uma tela de "novo lançamento") deve aparecer automaticamente no dia certo do Fluxo de Caixa e no mês certo da Controladoria — um único lançamento, duas visões.
- Não existe mais o conceito de "digitar por cima da fórmula": todas as células desta tela são somente leitura, calculadas a partir de `transactions`, `debts` e `recurring_expenses`.
