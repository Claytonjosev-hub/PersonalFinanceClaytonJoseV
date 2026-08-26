# Aba: Investimentos

> Documento 6 de 6. Pressupõe o modelo de dados e o design system definidos em `00-logica-central-e-geral.md`.

## Propósito

Aba nova (não existia na planilha original) para acompanhar quanto está guardado/investido, com detalhe de rentabilidade, liquidez e carência — e alimentar o cálculo de patrimônio líquido (investimentos − dívidas) que aparecerá no Dashboard da Fase 2.

## Tipos de investimento cobertos

1. **Renda fixa** (CDB, Tesouro Direto, LCI/LCA)
2. **Renda variável** (ações, FIIs, ETFs)
3. **Reserva de emergência** (valor simples, alta liquidez, sem detalhamento de rentabilidade)

## Campos por tipo

### Renda fixa
- Descrição, instituição
- Valor investido / valor atual
- Taxa (ex: "110% CDI", "IPCA + 6%")
- Indexador (CDI / IPCA / Prefixado)
- Liquidez (Diária / No vencimento / D+30, etc.)
- Carência, quando houver
- Data de aplicação / data de vencimento

### Renda variável
- Descrição (ticker), instituição/corretora
- Quantidade, preço médio de compra
- Valor atual (atualizado manualmente pelo usuário nesta fase)
- Sem vencimento/carência (liquidez tratada como "conforme mercado")

### Reserva de emergência
- Descrição (ex: "Reserva — Nubank"), instituição
- Valor atual
- Liquidez (normalmente "Diária")

## Estrutura da tela

- Lista/tabela por tipo de investimento (abas internas ou seções: Renda Fixa | Renda Variável | Reserva de Emergência)
- Card de resumo no topo: total investido, total atual, rentabilidade acumulada (valor atual − valor investido), separado por tipo e total geral
- CRUD completo (adicionar, editar, arquivar) para cada investimento
- Atualização de "valor atual" é manual nesta fase (sem integração automática com corretora/banco — ver seção 7 de `00-logica-central-e-geral.md`)

## Regras de negócio

- O total geral desta aba (soma de `current_amount` de todos os investimentos ativos) deve estar disponível como um valor que o Dashboard (Fase 2) pode consumir para calcular patrimônio líquido = total investido − saldo devedor total (vindo da aba Dívidas e Parcelamentos).
- Investimentos "arquivados" (ex: resgatados) saem do total ativo mas continuam no histórico para consulta.
