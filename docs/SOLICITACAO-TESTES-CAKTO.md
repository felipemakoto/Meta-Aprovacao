# Mensagem para o suporte da Cakto

Solicitação enviada ao suporte em 14/10/2026 pelo Gmail conectado, após autorização explícita do responsável. O Gmail confirmou o envio; resposta ainda não foi conferida nesta etapa. O texto abaixo preserva a solicitação preparada, sem credenciais ou dados de compradores.

**Destinatário:** infoprodutores@cakto.com.br

**Assunto:** Acesso a staging e confirmação do contrato da assinatura — Meta Aprovação

Olá! Estou integrando a assinatura mensal da **Meta Aprovação — Plataforma de Aprendizagem** ao meu site. O checkout de referência é https://pay.cakto.com.br/8wweqjo_1168765.

A documentação de ambientes orienta solicitar staging ao suporte. Preciso da URL oficial e de instruções para receber credenciais de teste por um canal seguro. Também gostaria de confirmar se esse ambiente permite testar uma assinatura e seu pagamento sem movimentar dinheiro real, incluindo checkout hospedado, webhooks, consulta de pedido, renovação e reembolso.

Para concluir a integração, preciso esclarecer:

1. Como comprovar a moeda BRL no retorno autenticado de `GET /public_api/orders/{id}/`? O contrato publicado não apresenta `currency`. Existe outro campo ou endpoint autoritativo? Como interpretar `baseAmount`, `discount` e `amount`, incluindo a taxa de serviço?
2. Minha assinatura tem preço base de R$22,99, com taxa de R$0,99. O cupom `primeiracompra` deve valer somente na primeira cobrança: preço do produto de R$11,50, total inicial de R$12,49 e total seguinte de R$23,98. Podem confirmar o arredondamento e a aplicação nas renovações para Pix Automático, cartão e Pix?
3. O cupom foi configurado para vencer em 31/10/2026. Qual é o horário exato de expiração e o fuso utilizado pela Cakto?

Obrigado!

Referências para consulta do responsável: [ambientes](https://docs.cakto.com.br/conceitos/ambientes) e [obter pedido](https://docs.cakto.com.br/api-reference/orders/retrieve). A existência de staging não comprova disponibilidade de checkout hospedado, gratuidade ou meios de pagamento simulados; essas condições precisam ser confirmadas pelo suporte.
