# Cakto — provedor escolhido em 03/10/2026

## Checkout informado e conferido em 03/10/2026

Usuário forneceu URL pública https://pay.cakto.com.br/8wweqjo_1168765 e cupom `primeiracompra`. Links regular/promocional salvos em .env.local ignorado, sem alterar credenciais ou preencher IDs fictícios. Identificadores de produto/oferta ainda pendentes; o sufixo do link não foi tratado como ID da API.

Conferência read-only no navegador, sem dados do comprador nem pagamento: cupom na URL foi aplicado depois do carregamento; Pix Automático mostrou desconto somente na primeira cobrança. Entretanto, base R$19,99/mês, primeira cobrança base R$10,00 e taxa de serviço ao comprador R$0,99 resultam em **R$10,99 agora e R$20,98 nas renovações**. Nome exibido inclui também a descrição longa. Corrigir na Cakto nome do produto, base R$20/mês e repasse da taxa antes de aprovar comercialmente. Prazo/fuso do cupom, métodos restantes e vínculo de pedido/sck não verificados. Não considerar oferta pronta só porque o cupom funciona. Captura de conferência em out/cakto-checkout-promocao.png, sem dados pessoais de comprador.

Formato do checkout contém underscore. Parser e migration incremental `20261003170000_cakto_checkout_slug.sql` passam a aceitar caracteres alfanuméricos, underscore e hífen no único segmento do caminho Cakto. Domínio HTTPS, ausência de credenciais/hash/porta, cupom único e veto a outros parâmetros preservados. Migrações anteriores não reescritas. Contratação continua bloqueada; nenhuma condição comercial do provedor foi alterada por esta etapa.

Ensaio da migration com rollback e dry-run aprovados; migration aplicada e suíte SQL repetida com sucesso. Quinze testes Node/HTTP, lint, TypeScript e build aprovados. Usuário perguntou onde localizar os IDs; solicitar tela/endereço do produto no painel antes de afirmar quais códigos visíveis correspondem à API. Não criar credencial nesta etapa apenas para localizar IDs.

Usuário pediu a troca da Kiwify pela Cakto, confirmou que já tem cadastro e informou que ainda não criou produto/oferta. Preço e visual aprovados permanecem: R$20/mês, R$10 somente na primeira mensalidade para novas contratações em outubro de 2026. Nenhuma contratação real foi ativada.

## Evidência oficial e configuração

A Cakto aceita cadastro de produtor com CPF ou CNPJ; o cadastro e a identidade/banco precisam cumprir os requisitos da plataforma. [Cadastro](https://ajuda.cakto.com.br/pt-br/articles/30-como-me-cadastrar-na-cakto).

Criar produto de assinatura recorrente e oferta mensal de R$20 no painel, conferindo intervalo e continuidade. O pagamento será feito no checkout hospedado; não coletar cartão/CPF no nosso site. [Recorrência](https://ajuda.cakto.com.br/pt/article/como-funciona-a-recorrencia-na-cakto-djvimw/), [API de oferta](https://docs.cakto.com.br/api-reference/offers/retrieve).

A atualização oficial de 30/09/2026 documenta o tipo **Desconto só na 1ª cobrança da assinatura**, criado dentro de **Produto de assinatura → Cupons**. Configurar 50% para cobrar R$10 inicialmente e R$20 nas renovações. Vale para cartão, Pix e Pix Automático; não para boleto/PayPal. Se houver repasse de taxa de serviço ao comprador, o total pode superar o preço base. Conferir/desativar esse repasse para manter os valores anunciados. Validar cupom salvo, método e total/renovação no painel/checkout antes de divulgar. [Cupom de primeira cobrança](https://ajuda.cakto.com.br/pt-br/articles/143-cupons-tres-novidades-no-ar).

O link oficial aceita `coupon` para pré-aplicar cupom e `sck` para rastreamento. Parâmetros podem persistir em cookies: o vínculo opaco permanece candidato, não prova de pagamento nem identidade. Sem dados pessoais na URL, mesmo que o provedor ofereça pré-preenchimento. Precisamos conferir retorno da referência na consulta de pedido/webhook, cookies antigos, ausência/troca, várias abas e renovações. [Cupom na URL](https://ajuda.cakto.com.br/pt-br/articles/61-como-usar-a-url-para-criar-um-checkout-pre-preenchido-na-cakto), [Rastreamento](https://ajuda.cakto.com.br/pt-br/articles/54-como-passar-parametros-de-rastreamento-na-url-do-checkout-src-utm-tags-entre-outros).

Validade até 31/10/2026 e fuso precisam ser conferidos nas opções reais do cupom. Expirar nossa intenção ou remover a promoção da tela não encerra um cupom no provedor. Se o painel não permitir restringir como prometido, resolver essa condição antes de habilitar contratação.

## Adaptação técnica

Checkout aceita exclusivamente HTTPS `pay.cakto.com.br`, cupom opcional e referência `sck` gerada no banco. Configuração usa `CAKTO_PRODUCT_ID`, `CAKTO_REGULAR_OFFER_ID`, `CAKTO_REGULAR_CHECKOUT_URL`, `CAKTO_OCTOBER_OFFER_ID`, `CAKTO_OCTOBER_CHECKOUT_URL`. Nenhuma variável antiga da Kiwify é usada como fallback. Oferta é entidade documentada pela Cakto; não confundir ID da oferta, produto, pedido ou assinatura.

Migration incremental `20261003160000_prepare_cakto.sql`, sem edição das migrations aplicadas: subscriptions aceita kiwify/cakto, padrão cakto, conservando identidade imutável e chave comercial por provedor. Intenções anteriores permanecem identificadas como kiwify; novos registros da RPC são somente cakto. `plan_id` da intenção passa a `offer_id`; URL precisa corresponder ao provedor. RPC retorna provider/offerId e o servidor rejeita mistura ou retorno antigo. Campo `external_plan_id` da assinatura permanece reservado; seu mapeamento futuro exige consulta verificada do provedor.

Trava `enabled:false` e botão indisponível permanecem. Não há credenciais Cakto, produto criado, compra, webhook ou concessão de acesso. O visual Premium, preços, cotas e páginas restantes foram preservados.

## Contratos das próximas etapas

O [índice oficial Cakto](https://docs.cakto.com.br/llms.txt) apresenta documentação própria de autenticação, pedidos, webhooks e assinaturas. Esses contratos substituem as propostas Kiwify nas etapas 28–31. A consulta de oferta documenta produto, preço e recorrência; não substitui consulta de pagamento. Não reutilizar headers, tokens, endpoints, eventos ou período de acesso da Kiwify.

Alguns guias integrais do índice não abriram nesta pesquisa. Ainda é necessário obter o contrato completo de autenticidade do webhook, consulta de pedido/pagamento e período pago, fixtures sanitizadas, idempotência, reembolso/cancelamento, reconciliação e staging. Não presumir algoritmo de assinatura, campo de vencimento ou estado que concede acesso. Retorno do checkout e estado enviado pelo navegador nunca liberam Premium.

## Testes e checkpoint

Quinze testes Node/HTTP Premium/checkout aprovados após a adaptação, incluindo rejeição de host/configuração/retorno Kiwify. SQL de intenções mantém conta, RLS/ACLs, imutabilidade, limite e repetição; `test_cakto.sql` acrescenta padrão Cakto, isolamento de identidades comerciais por provedor, preservação Kiwify, provider imutável e URL incompatível. Fixtures desfeitas por rollback. Conferir resultado de aplicação/auditoria no Estado do Projeto.

Próximo passo do usuário: criar produto/oferta, cupom e enviar link público do checkout, código do cupom e IDs de produto/oferta, se disponíveis. Não enviar credenciais. A integração de pagamento segue pendente; esta adaptação não equivale à liberação comercial.
