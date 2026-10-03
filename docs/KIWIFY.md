# Etapa 24 — pesquisa da integração Kiwify

Atualização de **02/10/2026**: usuário decidiu manter a Kiwify após a comparação de alternativas. Etapa 25 concluída com [modelo privado de assinaturas](ASSINATURAS.md); contratos de webhook/consulta recorrente e demais pendências abaixo continuam necessários antes de ativar pagamentos.

Documentação oficial consultada em **02/10/2026**. O usuário autorizou avançar após os limites gratuitos (checkpoint ab31177). Esta etapa entrega o contrato de integração e suas pendências; não cria produto, credencial, cobrança, webhook ou tabela. Próxima etapa: 25 — subscriptions. Os limites gratuitos continuam vigentes.

## Caminho da integração

Decisão do projeto: conta confirmada → página Premium → intenção de checkout registrada no servidor → checkout Kiwify → notificação → validação oficial da compra → vínculo privado à conta → direito de acesso calculado no servidor. Voltar do checkout ou receber um JSON com status pago não prova pagamento.

Usar a **API Pública de vendas**. O índice oficial separa seus endpoints das especificações bancárias. Não usar eventos de movimentação da Conta Digital como confirmação de assinatura deste site. [Índice oficial](https://docs.kiwify.com.br/llms.txt).

## API e credenciais confirmadas

| Operação | Contrato documentado | Uso planejado |
| --- | --- | --- |
| Autenticação | POST https://public-api.kiwify.com/v1/oauth/token; formulário client_id/client_secret | Obter token somente no servidor |
| Consultar venda | GET https://public-api.kiwify.com/v1/sales/{id} | Conferir uma ordem recebida pelo webhook |
| Listar vendas | GET https://public-api.kiwify.com/v1/sales; intervalo de datas até 90 dias | Reconciliação paginada por janelas |
| Configurar webhook | POST https://public-api.kiwify.com/v1/webhooks; produto, triggers e token | Configuração futura, após endpoint pronto |

Fontes: [OAuth](https://docs.kiwify.com.br/api-reference/auth/oauth), [consultar venda](https://docs.kiwify.com.br/api-reference/sales/single), [listar vendas](https://docs.kiwify.com.br/api-reference/sales/list) e [criar webhook](https://docs.kiwify.com.br/api-reference/webhooks/create).

A API requer Authorization: Bearer e x-kiwify-account-id. O painel oferece Apps → API → Criar API Key, com seleção de endpoints. Há limite documentado de 100 chamadas por minuto e resposta 429. Fontes: [informações gerais](https://docs.kiwify.com.br/api-reference/general) e [ajuda sobre API](https://ajuda.kiwify.com.br/pt-br/article/como-funciona-a-api-da-kiwify-1iosjhu/).

**Divergência documentada:** a página geral menciona 96 horas; o exemplo de OAuth devolve expires_in=86400. Decisão de implementação futura: usar a validade retornada pelo endpoint, com margem de renovação, sem fixar qualquer um desses prazos. Não gerar token a cada consulta. Validar com a credencial real quando ela for configurada. [Geral](https://docs.kiwify.com.br/api-reference/general), [resposta OAuth](https://docs.kiwify.com.br/api-reference/auth/oauth).

Nomes locais propostos, ainda não adicionados ao ambiente: KIWIFY_CLIENT_ID, KIWIFY_CLIENT_SECRET, KIWIFY_ACCOUNT_ID e KIWIFY_WEBHOOK_TOKEN. São convenções deste projeto, não nomes exigidos pelo provedor. O token do webhook é distinto do client_secret e do Bearer OAuth. Não pedir valores pelo chat, não usar NEXT_PUBLIC e não salvar no Git. Configurar apenas quando a etapa correspondente chegar. Produto/plano e link de checkout deverão ser cadastrados no servidor e permitidos explicitamente.

## Checkout e vínculo à conta

A Kiwify documenta sck entre os parâmetros de rastreamento. O exemplo da consulta de venda inclui tracking.sck. O exemplo oficial de webhook usa TrackingParameters.sck. Isso sustenta uma referência opaca, mas não comprova seu comportamento no produto real ou em renovações. [Rastreamento](https://ajuda.kiwify.com.br/pt-br/article/como-passar-parametros-de-rastreamento-na-url-do-checkout-src-utm-tags-entre-outros-1spiptc/), [consulta](https://docs.kiwify.com.br/api-reference/sales/single), [exemplo de webhook](https://kiwify.notion.site/Webhooks-pt-br-c77eb84be10c42e6bb97cd391bca9dce).

Proposta para etapa 27: gerar referência aleatória de alta entropia, com prazo e vínculo privado à conta/produto/plano; enviar somente essa referência em sck. Consultar a venda oficial e conferir a referência, produto, titularidade comercial e ordem antes de associar. Impedir reutilização da ordem por outra conta. Rastreamento pode ser alterado no navegador e não é prova de identidade nem de pagamento; também não deve ser tratado como senha ou sessão. Testar cookie de rastreamento antigo, referência ausente/trocada/expirada, múltiplas abas, renovação e e-mail diferente. Sem vínculo inequívoco, registrar pendência para recuperação autenticada, sem concessão automática por e-mail.

A Kiwify permite preencher dados pessoais pela URL; por decisão explícita do pedido original, não usaremos nome, e-mail, CPF, telefone ou UUID interno nesse endereço. O comprador informa os dados no checkout do provedor. [Parâmetros de preenchimento](https://ajuda.kiwify.com.br/pt-br/article/como-preencher-os-campos-do-checkout-pela-url-de7ezo/).

## Webhooks: fatos e pontos a confirmar

Apps → Webhooks permite escolher produto/eventos, testar, consultar logs e reenviar entregas. Usar testes sintéticos; não enviar compras reais a um coletor público. [Ajuda oficial](https://ajuda.kiwify.com.br/pt-br/article/como-funcionam-os-webhooks-2ydtgl/).

O exemplo oficial descreve POST JSON, confirmação 2xx, até cinco reenvios e espera de 40 segundos. Mostra order_id, order_status, webhook_event_type, Product.product_id e, para recorrência, Subscription com identificador, estado e customer_access.access_until. A abertura direta desse documento Notion falhou; o conteúdo citado foi recuperado pelo índice de busca, portanto é uma referência parcial, a validar antes de programar o receptor. [Documento oficial vinculado pela central](https://kiwify.notion.site/Webhooks-pt-br-c77eb84be10c42e6bb97cd391bca9dce).

**Não confundir nomes:** a configuração oficial usa compra_aprovada, mas o exemplo recebido usa order_approved. Não presumir igualdade entre trigger e webhook_event_type; capturar fixtures sanitizadas de cada evento no teste da etapa 28. [Configuração](https://docs.kiwify.com.br/api-reference/webhooks/create), [payload](https://kiwify.notion.site/Webhooks-pt-br-c77eb84be10c42e6bb97cd391bca9dce).

O campo token está documentado na configuração. Nas páginas oficiais acessíveis consultadas, não foi encontrado um contrato completo de validação da entrega: localização da assinatura, algoritmo, bytes assinados, codificação e proteção contra replay. Não concluir que assinatura inexiste; não inventar header, HMAC ou comparação direta com um token no JSON. Confirmar com documentação integral/suporte oficial e validar uma entrega de teste antes da liberação automática. A consulta autenticada de venda será uma verificação independente; ausência de autenticidade ou falha do provedor não concede Premium. [Criar](https://docs.kiwify.com.br/api-reference/webhooks/create), [consultar webhook](https://docs.kiwify.com.br/api-reference/webhooks/single).

## Estados e decisões propostas para etapas 25–31

Os triggers abaixo são documentados na configuração; as ações são **propostas do nosso sistema**, sujeitas à confirmação da compra e do contrato de cada evento. [Referência de triggers](https://docs.kiwify.com.br/api-reference/webhooks/create).

| Trigger configurado | Tratamento proposto |
| --- | --- |
| compra_aprovada / subscription_renewed | Consultar pagamento; registrar ordem única e atualizar período comprovadamente pago |
| pix_gerado / boleto_gerado / compra_recusada | Não conceder acesso novo |
| subscription_canceled | Registrar cancelamento; conservar período pago válido, salvo revogação confirmada |
| subscription_late | Não estender período sem pagamento; tolerância comercial ainda precisa ser definida |
| compra_reembolsada / chargeback | Conferir ordem afetada e reavaliar acesso, sem apagar histórico |
| carrinho_abandonado | Sem alteração de direito de acesso |

Separar provider_status de access_until e do direito local. Não somar um mês a cada entrega nem usar apenas status active. A mesma venda repetida não estende acesso; um evento antigo não deve restaurar uma ordem reembolsada. Serializar mudanças por assinatura/ordem e guardar evidência mínima de processamento. A chave de idempotência será definida após confirmar identificador de evento e versão/tempo disponível; order_id isolado é insuficiente para distinguir aprovação de reembolso.

Armazenar somente identificadores comerciais necessários, produto/plano permitido, estado, datas normalizadas, vínculo ao usuário e resultado da validação/processamento. Não conservar indefinidamente payload bruto, CPF, endereço, cartão, códigos Pix ou links de criação de senha Kiwify. Definir retenção e expurgo nas etapas de eventos. Erros precisam de nova tentativa recuperável; responder 2xx apenas depois de persistir o recebimento durável ou concluir a operação, sem perder eventos entre confirmação e gravação.

A consulta de venda documentada mostra id/status/product/customer/tracking, mas não estabelece um contrato completo de assinatura recorrente ou access_until. O bloco scheduled_installment refere-se ao Parcelado Kiwify; não será usado como assinatura recorrente. Falta confirmar o mecanismo oficial de consulta do período/estado atual de recorrência para reconciliação. Não inventar /subscriptions. [Consultar venda](https://docs.kiwify.com.br/api-reference/sales/single).

## Recorrência: atualização relevante

Criar produto exige modalidade Assinatura recorrente e plano com frequência; cancelamento interrompe novas cobranças e não realiza automaticamente reembolso. [Criar assinatura](https://ajuda.kiwify.com.br/pt-br/article/como-criar-um-produto-de-assinatura-9crmrj/).

O artigo de 2021 explica Pix/boleto com renovação manual e atraso de até cinco dias. Já o artigo atualizado em **11/08/2026** descreve Pix Automático como padrão nas novas assinaturas Pix, configurável por produto, com duas retentativas espaçadas por três dias. Não aplicar o texto antigo a todo Pix nem converter prazo de cobrança do provedor em tolerância Premium do nosso site. Conferir o produto/método real e seu período pago. [Fluxo manual antigo](https://ajuda.kiwify.com.br/pt-br/article/como-funciona-a-assinatura-no-boleto-e-pix-nsw99t/), [Pix Automático atual](https://ajuda.kiwify.com.br/pt-br/article/como-funciona-a-assinatura-no-pix-automatico-pjvmtz/).

## Pendências antes de aceitar pagamentos

| Etapa | Evidência necessária |
| --- | --- |
| 25 — subscriptions | Schema privado, estados separados, restrições de propriedade, acesso negado por padrão, migração/testes sem habilitar Premium |
| 26 — Premium | Mockup → aprovação → implementação; preço, frequência e benefícios reais definidos pelo usuário |
| 27 — checkout | Conta/produto/plano aprovados, URL oficial, referência opaca testada, domínio HTTPS público |
| 28 — webhook | Contrato oficial de autenticidade, fixtures por evento, duplicação/ordem invertida, gravação durável e erros |
| 29 — validação | Credencial com escopo mínimo, consulta real, produto/plano/venda/vínculo conferidos; falha não libera acesso |
| 30 — reconciliação | Consulta oficial de recorrência confirmada; paginação, limites, reprocessamento e recuperação administrativa auditada |
| 31 — ciclo de vida | Política comercial de atraso, cancelamento, reembolso/chargeback e testes por método |

Ainda não foram verificados em conta real: credenciais/scopes, produto/plano, retorno de sck, payloads completos, assinatura da entrega, sandbox, fuso de datas sem offset e consulta de recorrência. Localhost não é endpoint público de recebimento. Essas pendências restringem a integração futura, mas não impedem concluir a pesquisa nem preparar o schema seguro na etapa 25.

## Encerramento e verificação

Pesquisa conferida com fontes primárias; diferenças e incertezas registradas explicitamente. Nenhum endpoint do provedor chamado com credenciais, nenhum pagamento/teste de compra realizado. Apenas esta documentação, README, Estado do Projeto e DECISIONS foram alterados. Não repetir lint/build/testes de aplicação para mudanças somente em Markdown; verificar diff e checkpoint local. Não há novo visual para testar nesta etapa. Pausa antes da etapa 25.
