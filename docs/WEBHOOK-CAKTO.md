# Webhook Cakto — contrato confirmado pelo suporte em 20/10/2026

## Estado atual

**Decisão posterior do responsável, 20/10/2026:** compra real dispensada e removida dos requisitos do projeto. As instruções históricas abaixo que a exigiam foram superadas. Mantêm-se os ensaios técnicos e as outras conferências; não registrar compra/assinatura comercial como validada sem essa evidência. Checkout continua desativado nesta etapa.

**Atualização: entrega do provedor validada em produção em 20/10/2026.** O registro desta rodada está ao final; trechos sobre a correção ainda local descrevem sua implementação anterior à publicação.

Correção local do receptor `POST /api/webhooks/cakto`: autenticação pelo campo `secret` do JSON, sem exigir `X-Cakto-Timestamp` ou `X-Cakto-Signature`. Segue a confirmação direta do suporte enviada pelo responsável nesta conversa em 20/10/2026. A documentação pública ainda contém trechos sobre HMAC que divergem dessa resposta; esses trechos não são o contrato implementado.

A contratação continua desativada em `checkout-launch.ts`. Esta correção não publica o site, não muda ofertas/preços, não concede Premium e não substitui a validação comercial de uma compra real. Não houve alteração de schema, RPC, processador, cron, permissões ou chaves.

## Autenticação e privacidade

- JSON com `secret`, `event` e `data`; V1 usa objeto em `data`, V2 pode usar lista.
- `secret` deve coincidir exatamente com `CAKTO_WEBHOOK_SECRET` do servidor. Comparação de digests SHA-256 de tamanho fixo com `timingSafeEqual`, sem trim ou normalização. Isso compara a chave; não é assinatura HMAC do corpo.
- O segredo é o configurado no webhook da Cakto, diferente de `CAKTO_CLIENT_SECRET`. Nunca usar `NEXT_PUBLIC`, query string, navegador ou documentação para guardá-lo.
- Limite de corpo de 256 KiB e prazo de leitura de três segundos. Apenas POST JSON sem codificação de conteúdo ou query.
- Headers supostos de assinatura não substituem um `secret` ausente ou incorreto. Login/cookies e e-mail do comprador não autenticam o provedor.
- Corpo cru, segredo, nome, e-mail, CPF e cartão não vão para a inbox nem para os logs. A normalização comercial existente foi preservada.

## Respostas

| Situação | HTTP | Efeito |
| --- | --- | --- |
| Secret correto, evento e produto/oferta elegíveis, gravação concluída | 200 | Sinal sanitizado salvo na inbox privada |
| Secret correto, produto/oferta fora da lista (incluindo fixture da Cakto) | 200 | Ignorado, sem gravar nem conceder acesso |
| Secret correto, evento não utilizado ou payload incompatível | 200 | Ignorado, sem gravar; investigar o diagnóstico se for uma entrega real |
| Secret ausente, inválido ou incorreto | 401 | Nenhum processamento |
| JSON/UTF-8 inválido, query, tipo/codificação ou tamanho incompatível | 400/408/413/415 | Nenhum processamento |
| Configuração ausente ou falha ao gravar evento elegível | 503 | Recebimento não confirmado |

HTTP 200 e `{received:true}` confirmam a entrega, não a compra ou liberação do plano. Eventos autenticados sem aplicação recebem 200 conforme a orientação do suporte. Não é enviado 200 para uma compra elegível que falhou ao gravar: isso esconderia perda de evento. A Cakto informou que respostas 4xx não são reenviadas; não depender de retentativas automáticas também para erros 5xx. Usar histórico/reenvio do provedor e a reconciliação independente já existente.

V2 mantém validação atômica do lote: um item inválido/estrangeiro impede salvar parte dele. O lote autenticado é reconhecido e ignorado; compras reais continuam dependendo da reconciliação. Não incluir produto fictício ou ampliar a lista de ofertas para fazer o botão Testar passar.

## Teste fictício e pagamento real

Segundo o suporte, Testar inclui a mesma estrutura e o secret, mas usa dados fictícios como John Doe e Produto Teste. Não existe sandbox de pagamentos. O teste comprova conectividade/autenticação; não comprova compra, recorrência ou concessão de Premium.

O receptor não procura a conta pelo e-mail. Ele só guarda sinais comerciais sanitizados. O processador existente consulta o pedido na API autenticada da Cakto, resolve a referência de um checkout privado e verifica status, produto, oferta, assinatura, moeda, valores e datas antes de conceder acesso. Deduplicação da inbox, períodos de acesso, reembolsos e reconciliação permanecem iguais. Um secret válido isoladamente nunca é prova de pagamento.

## Diagnóstico seguro

Procurar `cakto_webhook_diagnostic` nos logs do servidor. Campos: status, motivo fixo e `authentication` com presença/formato do secret e resultado booleano da comparação. Nunca registrar valores ou mensagens brutas de exceções.

Motivos esperados: `missing_secret`, `invalid_secret_format`, `secret_mismatch`, `product_or_offer_ignored`, `event_ignored`, `payload_ignored`, `persisted`, `configuration_missing`, `invalid_json`, `body_rejected` ou `processing_failed`. `payload_ignored` em uma entrega real exige conferir o contrato sanitizado; não tratá-lo como pagamento processado.

## Conferência e publicação

1. Rodar os testes locais do receptor, de pagamentos, automação, Premium e checkout; lint e build.
2. Publicar a versão corrigida quando autorizado. A versão pública anterior continua com o comportamento anterior até esse deploy.
3. Confirmar que `CAKTO_WEBHOOK_SECRET` do ambiente publicado coincide com o painel, sem expor a chave no chat.
4. Enviar Compra aprovada pelo Testar da Cakto à URL HTTPS pública terminando em `/api/webhooks/cakto`.
5. Esperar 200 e `product_or_offer_ignored` para produto/oferta fictícios; nenhum Premium é liberado. Falha de autenticação exige conferir a configuração, não desabilitar a validação.
6. Antes de ativar contratação, validar pagamento/assinatura real de ponta a ponta e as demais pendências comerciais. A ausência de sandbox não autoriza transformar fixture em venda.

```powershell
npm.cmd run test:webhook
npm.cmd run test:payment
npm.cmd run test:promotion
npm.cmd run build
```

`test:webhook:http` confere rejeição no endpoint local. `test:webhook:integration` sobe Next em modo produção no loopback 3101 com segredo efêmero, usa o Supabase ligado, insere somente fixtures aleatórias e as remove no finally. Exige build, ambiente e CLI configurados; não executar como um teste sem efeito no banco. Foi atualizado para secret no JSON. Sua execução antiga com HMAC não comprova a nova autenticação.

## Histórico e fontes

Os registros anteriores de 03–06/10 sobre HMAC, timestamp e o suposto significado de um 400 foram substituídos pela confirmação do suporte. Não inferir autenticidade de entregas antigas apenas por uma captura de status. A inbox privada e sua deduplicação já tinham sido implementadas e verificadas; não foram alteradas nesta correção.

Fontes públicas consultadas: [guia de webhooks](https://docs.cakto.com.br/conceitos/webhooks), [criar webhook](https://docs.cakto.com.br/api-reference/webhooks/create), [testar webhook](https://docs.cakto.com.br/api-reference/webhooks/test-webhook), [central de ajuda](https://ajuda.cakto.com.br/pt-br/articles/1-como-funcionam-os-webhooks-na-cakto-guia-completo). Em caso de divergência sobre a autenticação atual, esta implementação segue a resposta do suporte fornecida pelo responsável.

Validação de 20/10/2026: 66 testes isolados/regressões, lint e compilação de produção/TypeScript aprovados. Rota Next real em produção isolada conferiu secret ausente/incorreto 401, fixture autenticada sem headers 200, evento/payload sem aplicação 200 e armazenamento indisponível 503. Segredo efêmero, sem banco real, chamada à Cakto ou cobrança. Integração com persistência no Supabase e entrega originada no painel ainda não repetidas nesta versão.

## Entrega pelo Testar do painel — 20/10/2026

- Versão publicada: 6320a28, status Vercel success.
- Webhook Meta Aprovação, ID72194, ativo, URL https://meta-aprovacao.vercel.app/api/webhooks/cakto.
- Responsável fez login. Um único evento fictício Compra aprovada foi enviado pelo botão Testar.
- Histórico da Cakto: 20/10/2026 19:27:53, horário de São Paulo; HTTP200/200 OK, latência134ms; uma entrega, zero falhas nas últimas24h.
- A confirmação foi conferida no histórico de entrega, além do aviso de envio da interface. Nenhum payload, segredo ou dado de comprador foi aberto ou exportado.
- A API autenticou a credencial local, mas negou a listagem de webhooks com403. Não foram ampliadas permissões ou geradas chaves; o teste ocorreu pelo painel já autorizado.
- Uma prova direta e isolada com produto/oferta fictícios confirmou401 tanto para chave incorreta quanto para a chave do ambiente local. O sucesso posterior da entrega originada na Cakto confirma que a configuração de produção aceita o segredo do provedor. A credencial local está divergente e não foi substituída nesta rodada.

Entrega/autenticação aprovadas; não houve cobrança, ativação de checkout ou mudança no processador. O teste não certifica pagamento, recorrência, vínculo à conta, promoção ou concessão de Premium. A validação comercial real e a reconciliação segura da configuração local permanecem pendentes. Não enfraquecer a autenticação para acomodar a chave local divergente.

## Alinhamento local e dispensa de compra real — 20/10/2026

O responsável dispensou a compra real. A política de prontidão agora declara realPurchaseRequired:false, substitui essa exigência pelos ensaios com eventos simulados e informa expressamente que esses testes não certificam uma transação comercial. Aprovação de lançamento e ativação do checkout continuam independentes e desativadas; não há alteração no processamento, valores, planos, permissões ou automação.

A chave foi conferida somente em memória. A leitura automatizada do formulário protegido não disponibilizou uma chave reutilizável; sua cópia inicial recebeu401 e foi revertida, sem salvar o formulário. Isso não comprova uma diferença entre o segredo cadastrado no painel e o enviado. O secret efetivamente enviado na entrega de teste e aceito pela produção foi então colocado apenas em CAKTO_WEBHOOK_SECRET do .env.local ignorado pelo Git. As demais variáveis foram preservadas e nenhum valor secreto foi gravado na documentação ou em captura.

Prova final direta no endpoint público em20/10/2026 às19:33:31 de São Paulo: chave incorreta401/received:false; chave local alinhada200/received:true; no-store nas duas respostas. Produto e oferta deliberadamente fictícios, sem persistência comercial, cobrança ou concessão de Premium. Esta prova foi originada localmente, separada do Testar da Cakto já confirmado às19:27:53. Nenhuma configuração de produção ou do provedor foi alterada.
