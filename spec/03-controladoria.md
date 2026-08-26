# Aba: Controladoria

> Documento 4 de 6. Pressupõe o modelo de dados e o design system definidos em `00-logica-central-e-geral.md`.

## Propósito

Visão mensal (um mês por coluna, para os N meses definidos em Parâmetros) cruzando receitas e despesas. **Não é uma tabela com dados próprios** — é uma agregação, por mês, do razão único (`transactions`) somado ao cronograma de dívidas (`debts`) e às despesas fixas (`recurring_expenses`). Isso garante que bate sempre, célula a célula, com o Fluxo de Caixa (mesma fonte, granularidade diferente).

## Estrutura da tela (por mês)

### 1. Receitas
- Linha por categoria de receita (Salário, Bonificação, Outras Receitas, e quaisquer categorias de receita que o usuário criar)
- Total de receitas do mês

### 2. Despesas
- Uma linha por forma de pagamento (Cartão Itaú, Cartão BTG, Cartão Nubank, Financiamento, Débito/Pix), expansível para mostrar o detalhamento por categoria dentro daquela forma de pagamento (ex: dentro de "Cartão Itaú": Compras Parceladas, Assinaturas, Supermercado, Outros)
- "Compras Parceladas" de cada forma de pagamento vem automaticamente do cronograma de dívidas (não editável aqui)
- Demais categorias (Supermercado, Alimentação, Saídas e Lazer, Outros etc.) somam os lançamentos manuais/importados do mês (`transactions` com `source` manual ou import_csv)
- Total de despesas do mês

### 3. Resultado do mês
- Resultado = Total de receitas − Total de despesas
- Saldo acumulado projetado = saldo inicial (Parâmetros) + soma de todos os resultados desde o mês inicial até o mês corrente da coluna

### 4. Indicadores
- % da renda comprometida com dívidas = soma das parcelas de dívidas do mês / total de receitas do mês
- % da renda gasta = total de despesas do mês / total de receitas do mês
- Alerta: "DÉFICIT" se resultado do mês < 0, "OK" caso contrário — exibido com cor semântica (vermelho/verde) do design system

## Regras de negócio

- Nenhum número nesta tela deve ser digitável diretamente — tudo é calculado. Lançamentos manuais (o que hoje era digitado direto na Controladoria da planilha) são feitos numa tela/formulário de lançamento que alimenta `transactions`, e a Controladoria só reflete o resultado.
- Alterar um parâmetro (ex: valor de despesa fixa) ou uma dívida deve refletir automaticamente nos meses futuros da Controladoria assim que salvo, sem passo manual de "atualizar".
