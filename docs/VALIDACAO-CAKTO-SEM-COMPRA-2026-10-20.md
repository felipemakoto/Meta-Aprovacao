# Validação técnica da Cakto sem compra — 20/10/2026

## Atualização: moeda documentada e adaptação implementada

Esta atualização substitui a pendência monetária descrita abaixo. Conferência direta das páginas oficiais de [produto](https://docs.cakto.com.br/api-reference/products/retrieve), [oferta](https://docs.cakto.com.br/api-reference/offers/retrieve) e [webhooks](https://docs.cakto.com.br/conceitos/webhooks): os schemas REST de produto/oferta incluem currency; o webhook define data.currency como moeda dos valores, igual à moeda do produto. A extração do Context7 omitiu campos presentes na página; foi necessário conferir as páginas oficiais completas.

Consulta autenticada somente leitura à oferta configurada retornou HTTP200, currency BRL e identificadores de oferta/produto correspondentes. Não houve consulta de compradores ou compra real.

O leitor de pedidos agora consulta o detalhe autenticado da oferta da assinatura quando um pedido pago não tem currency. Confere produto, oferta e assinatura, não substitui moeda explícita e não presume BRL. Moeda ausente/inválida/estrangeira não aprova pagamento; indisponibilidade da consulta gera falha controlada. Cancelamento/reembolso não dependem dessa consulta adicional. A mesma normalização atende primeira cobrança e renovação, preservando os demais validadores e sem alteração de banco.

Limite da evidência: fallback usa a configuração atual autenticada da oferta, não um snapshot histórico da moeda da transação. Isso se apoia no contrato documentado de moeda do produto; uma migração futura de moeda/oferta precisa tratar separadamente cobranças antigas e preservar sua evidência original. Não usar o webhook sozinho como prova de pagamento.

Testes adicionados cobrem primeira cobrança, renovação, valores incorretos, moeda explícita conflitante, moeda ausente, identidade incompatível, ID inválido e HTTP403/429/503. Diagnóstico da nova consulta mantém compatibilidade com a RPC publicada, sem ampliar o vocabulário persistido no banco. Checkout continua desativado.

Fuso do cupom: a pesquisa pública não confirmou a regra do painel. A aplicação continua usando America/Sao_Paulo; o painel foi salvo em31/10/2026 às23:59. Não certificar equivalência entre esses horários nem comportamento do último minuto. Não foi criado cupom temporário, alterada promoção ou feita compra. Essa incerteza não impede implementar/testar a integração; permanece explicitada para a decisão de lançamento.

Complemento: [proposta técnica de retenção](PROPOSTA-RETENCAO-CAKTO.md), sem execução de descarte. Nova consulta documental não confirmou moeda do pedido nem fuso de endTime; a solicitação ao suporte foi detalhada nesse documento e continua não enviada.

Compra real dispensada pelo responsável. Não foi criada cobrança, fornecido dado de comprador/cartão, acionado botão de pagamento ou ativado checkout. Esta rodada reuniu consultas comerciais, testes de integração com provedor simulado e o ajuste de horário do cupom explicitamente autorizado.

## Conferências concluídas

| Item | Evidência |
| --- | --- |
| Oferta | API autenticada: oferta 8wweqjo ativa, R$22,99, assinatura mensal, período30 e renovações até cancelamento. |
| Cupom | Painel: primeiracompra, BRL, desconto50%, apenas na primeira cobrança. |
| Validade | Início01/10/2026 às14:13. O término estava em31/10/2026 às12:59. Responsável autorizou mudar somente o horário para23:59; salvo com confirmação de sucesso e reabertura mostrou31/10/2026 às23:59, mantendo BRL/50%/primeira cobrança. O painel não explicita o fuso. |
| Checkout promocional | Pix Automático, cartão em parcela única e Pix: desconto exibido deR$11,49, produtoR$11,50, taxaR$0,99, totalR$12,49; próximas cobranças exibidas emR$23,98/mês. Nenhum formulário de comprador foi preenchido. |
| Checkout regular | Sem cupom, os três métodos exibiram produtoR$22,99, taxaR$0,99 e totalR$23,98. Somente valores apresentados; processamento de uma transação não foi ensaiado. |
| Webhook e banco | test:webhook:integration passou: rota Next em produção no loopback, secret efêmero no JSON, rejeição de chave inválida/ausente, persistência, deduplicação concorrente, evento de reversão, lote inválido sem gravação parcial e descarte de dados privados. Fixtures removidas. |
| Acesso e assinatura simulados | test:payment:integration passou: primeira concessão30dias, renovação antecipada até60dias sem duplicação concorrente, cancelamento preserva período pago, reembolso revoga e replay não restaura. Resposta sem moeda permanece em revisão. Apenas conta/intenções/eventos aleatórios; fixtures removidas no finally. |
| Operação | Amostra consultada confirmou funcionamento, última conclusão20/10/2026 às19:38:06SP; fila sem tarefas prontas/em execução/em revisão/esgotadas. Não é garantia permanente de disponibilidade. |

Os testes de integração utilizaram as RPCs e o banco ligados ao ambiente local, conferindo antes que o projeto ligado correspondia ao projeto configurado. Não alteraram schema, permissões, cron ou configuração do provedor. O servidor temporário de teste foi encerrado pelo script. Os dados fictícios não representam uma venda nem acesso comercial.

## Contrato monetário e limites

A documentação atual de [Obter Pedido](https://docs.cakto.com.br/api-reference/orders/retrieve) exemplifica baseAmount/discount/amount como strings decimais e couponCode como campo separado. A unidade decimal é compatível com o parser existente. Ela não garante um campo currency no pedido. O BRL visível no cupom confirma a configuração comercial consultada, mas não substitui uma prova autoritativa de moeda na consulta de pagamento.

A consulta da oferta está permitida pela credencial atual. A consulta de detalhe do produto foi negada com403, sem ampliar permissões. O validador continua retornando currency_unconfirmed se o pedido não trouxer moeda explícita; não foi acrescentado BRL presumido nem aceitação de evento como prova de pagamento.

Para concluir a conferência do contrato sem compra, obter confirmação documental da Cakto sobre qual campo/consulta autenticada informa a moeda do pedido e qual fuso interpreta endTime dos cupons. Não é necessário fazer ou propor compra real para isso. A política detalhada de retenção dos registros financeiros/técnicos também permanece pendente; não foi criado descarte automático.

Pergunta técnica preparada, não enviada: “No GET público de um pedido, qual campo ou consulta autenticada informa sua moeda? O contrato documentado não lista currency. Há garantia explícita de BRL para pedidos de produtos em BRL ou um endpoint autorizado para confirmar isso? Qual fuso é usado no endTime dos cupons?”

## Privacidade da conferência anterior

A leitura automatizada de campos protegidos pode retornar uma máscara em vez do valor do formulário. Não se pode concluir que o segredo cadastrado no painel difere do enviado apenas por essa leitura. O alinhamento local anterior foi confirmado pelo secret do JSON do evento de teste e por prova direta200 com a chave correta/401 com incorreta, sem exibir valores. Os registros foram corrigidos para evitar atribuir ao provedor uma diferença não comprovada.

Nenhuma mudança de código da aplicação nesta rodada. Checkout desativado; valores, acesso, catálogo e limites preservados. A única configuração comercial alterada foi o horário final do cupom, autorizado pelo responsável.
