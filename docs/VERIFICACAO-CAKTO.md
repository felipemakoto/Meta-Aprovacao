# Etapa 29 — verificação independente do pagamento

## Intenção e evidência integradas em 06/10/2026

`payment-processing.ts` processa administrativamente um evento durável permitido, consulta pedido/assinatura, resolve a intenção privada exclusivamente pelo sck da resposta da API e executa o verificador. Não usa status, referência ou identidade do cliente do webhook como prova. Pedidos/eventos não permitidos recebem review; falhas de transporte/limite/credenciais recebem retry. Resolução ou gravação indisponível termina com erro sem alegar sucesso.

DAL server-only `src/lib/data/payments.ts` e comando local `npm.cmd run cakto:process -- ID-DO-EVENTO` disponíveis. Não há rota pública, cron ou consumo automático da inbox; agendamento, repetição e reconciliação pertencem à etapa 30. O receptor do webhook mantém resposta somente após persistir sinal, sem aguardar chamadas lentas à Cakto.

Migration `20261006180000_cakto_payment_checks.sql` ensaiada com rollback/teste SQL, dry-run conferido e aplicada ao projeto ligado. Teste SQL repetido após aplicação. Nova tabela privada de verificações, RLS sem policies/acesso direto para clientes ou service_role. RPCs exclusivamente service_role leem sinal comercial, resolvem intenção sem expor proprietário e salvam campos fixos mínimos. Nenhum JSON de payload bruto ou dados pessoais. Checks conferem IDs, preço, período da intenção, data paga e conta confirmada novamente dentro da transação. Evidência verificada tem unicidade de pedido/intenção/assinatura; tentativas distintas de revisão preservadas e duplicatas exatas ignoradas. Registros são históricos, não direitos de acesso; eventos posteriores de reversão devem ser tratados na etapa 31.

Sete testes Node passaram. Lint e build/TypeScript aprovados. Integração adicional `npm.cmd run test:payment:integration` usa API de provedor simulada e RPC/banco reais: duas verificações concorrentes produziram uma evidência, resposta sem currency ficou em revisão, usuário não ganhou acesso nem registro em subscriptions. Fixtures randômicas de usuário/intenção/inbox/verificação removidas no finally. Chaves/configuração real não alteradas, nenhuma compra realizada. Teste não prova resposta real da Cakto.

Etapa 29 segue com validação externa pendente: moeda explícita não consta do contrato de Obter Pedido, preços/amount/assinatura/sck de pedido real ainda não conferidos, concessão não implementada enquanto contrato estiver indefinido. Não substituir moeda ausente por BRL presumido, não liberar botão de compra, nem recomendar pagamento real para esse teste. Reconciliação pode ser preparada independentemente desses requisitos. Registros abaixo preservam a evolução.

## Implementação inicial em 06/10/2026

Usuário adicionou Pedidos e Assinaturas à chave existente. Consultas autenticadas de listagem dos dois recursos retornaram HTTP 200, sem impressão de token ou respostas completas. Listagem de pedidos com filtro do produto retornou count=0/results vazio; não há pedido disponível para conferir resposta real de detalhe. Nenhuma cobrança criada.

`cakto-api.ts` consulta pedido por UUID e assinatura fornecida pela resposta autoritativa, com host fixo, redirect:error, no-store, oito segundos por operação e limites 16 KiB/token e 1 MiB/recurso. Não recebe ID de assinatura do webhook. Erros têm mensagens fixas sem corpo bruto ou credenciais. `cakto-server.ts` é server-only. Sem endpoint público administrativo.

`payment-verification.ts` verifica apenas primeira mensalidade contra expectativa de intenção privada: IDs do pedido/assinatura/produto/oferta, vínculo parent_order/orders, tipo subscription/main, período 1, recorrência 30/infinita, estado paid/active sem reversão, sck exato, datas, moeda explícita BRL e centavos exatos. Base 2299, desconto 1149/cupom primeiracompra/total1249 ou desconto0/total2398; assinatura base2299. Não confunde taxas com preço do produto. Retorno positivo é evidência candidata, não concessão de Premium. Renovação não é aprovada por esse verificador.

Quatro testes de cenários passaram, cobrindo decisão com fixtures, divergências/reversões, identidade autoritativa nas consultas e falhas do transporte, sanitização da evidência, precisão decimal e ausência de credenciais nos erros. Lint e build/TypeScript aprovados.

Limites: Obter Pedido documenta subscription como string/null; Recuperar Assinatura documenta offer/product/orders e exige read + subscriptions. Confirmado caminho de consulta da oferta. O contrato de Obter Pedido não documenta moeda explícita; ausência recebe currency_unconfirmed, nunca inferida. Precisamos confirmar unidade monetária/forma da resposta real com provedor ou ambiente autorizado antes de automatizar aprovação. Nenhuma fixture gerada pelo agente prova o formato de produção. Persistência da evidência, resolução transacional da intenção, consumo da inbox e concessão ainda não conectados. Etapa 29 não encerrada; contratação permanece desabilitada.

Consulta administrativa opcional, somente com UUID de pedido real já existente, nunca pedido fictício ou cobrança criada para teste:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd run test:payment
npm.cmd run cakto:payment -- UUID-DO-PEDIDO
```

Script imprime somente booleanos de conferência comercial, sem dados pessoais, IDs ou credenciais. Não valida intenção nem concede acesso. Não enviar resposta completa no chat.

Fonte adicional: [Recuperar Assinatura](https://docs.cakto.com.br/api-reference/subscriptions/retrieve), consultada em 06/10/2026. Os parágrafos abaixo preservam a preparação inicial.

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
