# Cakto — provedor escolhido em 03/10/2026

## Validade confirmada pelo usuário

Em 03/10/2026 o usuário confirmou que primeiracompra vence em 31/10/2026. Horário/fuso não informados; não presumir equivalência exata com meia-noite de São Paulo na aplicação. Reconferir esse detalhe antes do lançamento. A data deixa de estar pendente de resposta; os registros abaixo refletem o estado anterior. Nenhuma configuração remota ou cobrança alterada nesta confirmação.

## Preço e arredondamento reconferidos

Em 03/10/2026, após aprovação da tela pelo usuário, consulta real da API confirmou oferta 8wweqjo active/subscription, base 22.99, intervalType month, interval 1, recurrence_period 30 e quantity_recurrences -1. Checkout novo confirmou cupom primeiracompra: desconto 11.49, primeira base 11.50, taxa 0.99, total 12.49 e próximas cobranças 23.98/mês. Valores correspondem à tela do site. Conferidos visualmente em Pix Automático, cartão e Pix sem preencher dados nem gerar cobrança. Isso confirma apresentação comercial, não teste de pagamento. Validade/fuso do cupom continua aguardando informação do usuário.

Guia integral de webhooks finalmente acessível pelo navegador, embora ferramenta de leitura web não tenha aberto a página: [contrato oficial](https://docs.cakto.com.br/conceitos/webhooks). Substitui a pendência de documentação de autenticidade; implementação ainda não iniciada. Plano técnico em WEBHOOK-CAKTO.md. Credenciais atuais permanecem somente read + offers; não houve ampliação de acesso ou registro remoto de webhook.

## Preço solicitado: R$22,99 + taxa

Usuário trouxe resposta do suporte: taxa de serviço R$0,99 não pode ser assumida/removida manualmente, inclusive nas renovações; negociação dependeria do Time Comercial. Usuário decidiu aumentar a base para R$22,99, sem incluir a taxa. Tela Premium agora separa base, taxa e total: renovação R$23,98. Campanha de outubro permanece 50% somente inicial; cálculo local em centavos arredonda base para R$11,50 e total R$12,49. Arredondamento real precisa ser confirmado no checkout após usuário alterar produto e oferta na Cakto, que na última consulta ainda custavam R$20. Nenhuma alteração comercial remota executada pelo agente.

Contratos e migration incremental 20261003180000_cakto_price_2299.sql atualizam somente os preços base esperados de novas intenções; histórico de R$10/R$20 preservado sem updates. Taxa não é receita/base do produto nem concedida como acesso. Lançamento continua bloqueado até conferência do provedor e validação de pagamentos. Dez testes isolados, cinco HTTP, lint/build aprovados. Migration ensaiada com rollback/testes e dry-run antes da aplicação; conferência mobile 320px sem overflow.

## Consulta real concluída em 03/10/2026

Nova aba do checkout conferida após falha da aba antiga: nome corrigido e base R$20/mês. Cupom primeiracompra aplicado automaticamente após carregamento, com desconto somente na primeira cobrança. Pix Automático ainda repassa taxa de serviço R$0,99: total **R$10,99 inicial e R$20,99/mês nas próximas cobranças**. Portanto, a oferta ainda diverge dos R$10/R$20 anunciados; usuário precisa ajustar o repasse de taxa na Cakto. Nenhum formulário de comprador preenchido ou pagamento efetuado. Outros métodos e validade/fuso do cupom ainda não conferidos.

Após o usuário salvar as credenciais no ambiente local, a autenticação e listagem oficial funcionaram. A API retornou uma única oferta do produto configurado: ID `8wweqjo`, nome Meta Aprovação - Plataforma de Aprendizagem, preço 20 reais, status active, type subscription, recurrence_period 30 e quantity_recurrences -1. `intervalType` retorna lifetime; esse campo não foi usado para conceder acesso nem como prova de mensalidade. A recorrência mensal também aparece no painel enviado pelo usuário. O script agora inclui o período de recorrência na saída comercial.

CAKTO_REGULAR_OFFER_ID e CAKTO_OCTOBER_OFFER_ID configurados no .env.local ignorado com o ID confirmado pela API. Mesma oferta, com cupom apenas na URL promocional. Nenhuma credencial/token impresso ou versionado, nenhuma cobrança criada. Restam conferir valores finais/taxas no checkout atualizado, desconto apenas inicial, prazo/fuso do cupom e vínculo de rastreamento/pagamento. Contratação segue desabilitada. Os registros abaixo são históricos.

## Estado atual: consulta do ID da oferta

As capturas mais recentes mostram nome corrigido, oferta R$20, recorrência mensal e renovação até cancelamento. O texto auxiliar de uma captura ainda exibe produto R$19,99; o checkout atualizado e eventual repasse de taxa precisam ser reconferidos. O ID da oferta não aparece nas capturas e não foi deduzido do link. Os registros anteriores abaixo descrevem a conferência inicial.

Foi preparada consulta administrativa local somente de leitura em `scripts/cakto-offers.mjs`. Autentica no endpoint oficial e lista ofertas filtradas pelo produto configurado, imprimindo apenas campos comerciais. Não grava IDs automaticamente, não cria cobranças, não consulta compradores e não ativa Premium. Paginação usa domínio fixo, sem seguir URLs recebidas com credenciais; erros não imprimem tokens ou corpo do provedor.

Para configurar:

1. No painel Cakto, abrir **Integrações → Cakto API → Criar Chave de API**.
2. Nome sugerido: **Meta Aprovação — consulta de ofertas**. Selecionar apenas escopos **read** e **offers**, sem write.
3. Guardar client_id e client_secret em `.env.local`, com nomes `CAKTO_CLIENT_ID` e `CAKTO_CLIENT_SECRET`. Não enviar no chat nem usar prefixo NEXT_PUBLIC. O segredo é mostrado somente na criação.
4. Na pasta do projeto, executar `node --env-file=.env.local scripts/cakto-offers.mjs`.

Fontes: [autenticação e permissões](https://docs.cakto.com.br/authentication), [consulta de ofertas](https://docs.cakto.com.br/api-reference/offers/list). Credenciais ainda não configuradas: nenhuma consulta real à API executada. Três testes isolados e ESLint dos arquivos aprovados. Identificar a oferta não conclui verificação de cupom, valores finais, vigência ou entrega do Premium; contratação permanece bloqueada.

## Checkout informado e conferido em 03/10/2026

Atualização após screenshot do painel: usuário informou ter corrigido o nome. Campo ID do produto mostra `89be91ab-b7a4-4f17-8e23-8db46f8c2261`, registrado em CAKTO_PRODUCT_ID no ambiente local ignorado. Tela também confirma recorrência Mensal e renovação até o cliente cancelar; valor ainda R$19,99. ID da oferta continua pendente: menu Ofertas visível no painel, solicitar a próxima tela. Sem alteração de preço/repasse na conta pelo agente, sem contratação habilitada.

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
