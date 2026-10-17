# Conferência de pagamentos — etapa 61

Retomada em **17/10/2026**, após o responsável concluir o login Google e solicitar avanço na integração de pagamentos. Foram consultadas a API real de ofertas e a listagem de pedidos, a prontidão administrativa e a documentação oficial. Não houve compra, criação de cobrança, reembolso comercial, troca de credenciais ou ativação da contratação.

## Resultado atual

- Oferta configurada continua ativa: assinatura de **R$ 22,99**, mensal, intervalo 1, recorrência de 30 dias e renovações ilimitadas (`-1`). Isso confirma a configuração da oferta; não demonstra pagamento, taxa, desconto ou renovação efetivamente cobrados.
- Listagem autenticada de pedidos pagos de assinatura do produto, de 01/10/2026 até o instante da consulta: **zero resultados, sem próxima página**. IDs, compradores e respostas brutas não foram registrados. Essa janela não é uma auditoria de todas as vendas da conta.
- A busca no Gmail por mensagens de/para a Cakto sobre staging, testes, API ou moeda desde 13/10 retornou somente a solicitação enviada em 14/10. Nenhuma resposta correspondente foi localizada; nenhum novo e-mail foi enviado.
- Prontidão às **17:53:06 de São Paulo**: sete critérios automáticos aprovados, operação `ok`, última execução bem-sucedida, sem alertas ou incidentes não resolvidos nessa amostra. `checkoutEnabled:false` e `launchApproved:false` permanecem.

## Testes realizados

**23 testes isolados aprovados**: 16 de pagamentos/transporte/autenticação, quatro de ciclo da assinatura e três de reconciliação. Cobrem divergência de produto/oferta, moeda ausente, valores, referências, reversões, limites, falhas da API, concorrência e recuperação.

O ensaio `test:payment:integration` passou com **banco/RPCs reais e respostas da Cakto simuladas**:

1. Primeira mensalidade adquiriu 30 dias completos.
2. Renovação concorrente estendeu a cobertura para 60 dias sem duplicar a prova ou o período.
3. Cancelamento preservou o período pago.
4. Reembolso retirou o acesso e repetição de evento anterior não o restaurou.
5. Reserva concorrente ficou exclusiva e uma reserva encerrada não pôde ser concluída novamente.
6. Conta e registros temporários exclusivos do ensaio foram removidos e a limpeza foi conferida.

Conferência posterior: inbox, fila, provas de pagamento/ciclo/renovação e períodos em **zero**. As 500 questões e os seis modelos publicados foram preservados. Não foi criado acesso comercial para o responsável ou qualquer aluno.

O ensaio prova a implementação da regra interna, **não o contrato de uma compra Cakto**. Como não houve alteração de código, não foi repetido o build do site.

## Evidência externa ainda necessária

A [documentação de Obter Pedido](https://docs.cakto.com.br/api-reference/orders/retrieve), consultada em 17/10, descreve valores decimais e estado pago, mas não enumera `currency`. A [consulta de assinatura](https://docs.cakto.com.br/api-reference/subscriptions/retrieve) também não estabelece esse campo. Isso não prova que toda resposta real o omita, nem autoriza preencher BRL por inferência. A validação continua exigindo evidência autoritativa suficiente.

A [documentação de ambientes](https://docs.cakto.com.br/conceitos/ambientes) continua indicando que o suporte fornece a URL e as credenciais próprias de staging; não confirma um checkout hospedado equivalente nesse ambiente. Nenhuma URL de teste foi deduzida.

Para encerrar a validação comercial, falta obter resposta oficial e/ou acesso ao ambiente de testes que permita conferir:

- Moeda, unidade e composição dos valores de pedido/assinatura, incluindo a taxa.
- Retorno da referência `sck` da intenção correta na API autenticada e vínculo do pedido à oferta/assinatura.
- Pagamento e renovação com as respostas reais do provedor, seguidos da liberação correta no site; reversão e deduplicação com esse contrato.
- Cupom apenas na primeira cobrança, totais esperados de R$ 12,49 inicial/R$ 23,98 seguintes e horário/fuso de expiração em 31/10/2026.

O próximo passo externo é a confirmação da Cakto na [solicitação já enviada](SOLICITACAO-TESTES-CAKTO.md). Não foi solicitado que o responsável pagasse para completar esta rodada. Nenhum campo obrigatório foi removido para fazer um teste sintético parecer comercial.
