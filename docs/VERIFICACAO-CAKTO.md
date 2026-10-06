# Etapa 29 — verificação independente do pagamento

Retomada em 06/10/2026. Pesquisa e requisitos preparados; implementação e consulta real de pedidos ainda não concluídas. Teste Cakto autenticado da etapa 28 foi rejeitado pelos IDs fictícios, sem persistência ou liberação de acesso.

## Pré-requisito de configuração

O endpoint oficial GET https://api.cakto.com.br/public_api/orders/{id}/ exige escopos read + orders. Chave anterior configurada com read + offers; usuário deve adicionar Pedidos ou criar chave adequada e salvar CAKTO_CLIENT_ID / CAKTO_CLIENT_SECRET diretamente em .env.local ignorado e Vercel (Secret, Production), sem expor valores. Preservar Ofertas se a mesma chave continuar atendendo à consulta comercial. Não são necessárias permissões de escrita, pagamentos, cartão ou saques para consultar pedidos.

## Critérios para implementação

- Evento autenticado é sinal para consulta, nunca comprovação de pagamento. Buscar pedido pelo UUID em endpoint fixo, sem seguir redirecionamentos com Bearer, com limites de tempo/tamanho e erros genéricos.
- Confirmar ID do pedido, produto permitido, oferta correspondente, moeda/valores e estado pago diretamente na resposta da API; campos ausentes ou divergentes não podem produzir aprovação.
- A documentação de Obter Pedido não mostra oferta no exemplo principal. Confirmar como estabelecer vínculo autoritativo com a oferta antes de inferir aprovação; não preencher campos ausentes com valores do webhook.
- Usar a intenção privada de checkout e referência opaca para vínculo à conta. Nunca associar por e-mail/CPF ou confiar em referência fornecida apenas pelo webhook. Verificar período de validade e preço histórico da intenção, distinguindo primeira mensalidade e renovação.
- Recusa, reembolso, chargeback, pagamento parcial, estado desconhecido, pedido não encontrado ou API indisponível não concedem Premium. Status ativo da assinatura sozinho também não comprova pagamento.
- Persistir apenas evidência comercial mínima, sem corpo bruto, segredo ou dados pessoais; deduplicação e transações preservam histórico e evitam concessões duplicadas. Não ativar contratação enquanto concessão, reconciliação e benefícios estiverem incompletos.
- Testar divergências de identidade/valores, estado não pago, falhas/limites da API, ausência de campos e repetição com fixtures. Consulta real depende de permissões válidas e pedido real ou ambiente de teste autorizado; não criar cobrança para validar integração.

Renovação/cancelamento/reembolso completos e reconciliação são etapas seguintes. Não alegar fluxo completo com teste sintético ou apenas HTTP 200.

Fontes: [Obter Pedido](https://docs.cakto.com.br/api-reference/orders/retrieve), [Autenticação](https://docs.cakto.com.br/authentication). Consultadas em 06/10/2026.
