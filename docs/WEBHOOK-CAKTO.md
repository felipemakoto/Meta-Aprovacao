# Etapa 28 — receptor implementado, entrega real pendente

## Entrega de teste autenticada em 06/10/2026

Captura do usuário confirma requisição CaktoBot/1.0 no domínio de produção após commit 2bcd2d7, status 400 e diagnóstico `product_or_offer_rejected`. Esse motivo só ocorre depois de assinatura e timestamp válidos. Confirmadas conectividade do provedor e autenticação dessa entrega. O teste usa produto/oferta fictícios, diferentes dos IDs permitidos, e foi corretamente rejeitado antes de persistir. O erro 401 anterior permanece sem causa determinada; não atribuir retroativamente ausência de assinatura. Headers vazio no painel não prova ausência no transporte.

Não liberar produto fictício nem trocar autenticação por secret no corpo. Persistência de evento real do produto, vínculo à conta e concessão de Premium permanecem pendentes. Segredo não registrado em documentação. Etapa 29 retomada: consultar pedido diretamente na API, sem confiar no status do webhook.

## Diagnóstico seguro em 06/10/2026

Site publicado pelo usuário em https://meta-aprovacao.vercel.app; login confirmado por imagem. Webhook cadastrado manualmente com disparo individual. Teste da Cakto recebeu 401; painel exibe Headers vazio e produto/oferta fictícios, o que não comprova ausência de headers no transporte. Segredo permanece fora da documentação.

Rota agora escreve uma linha `cakto_webhook_diagnostic` por POST nos logs do servidor. Inclui status, motivo fixo e, quando verificada, presença/formato dos dois headers, validade do horário (tolerância de cinco minutos) e resultado booleano da assinatura. Não registra valores de headers, horário original, segredo, corpo, IDs, dados pessoais ou mensagens de exceção. Resposta pública e critérios de autenticação preservados; falha no logger não afeta a resposta.

Após publicar esta alteração, abrir Vercel → Logs e enviar Compra aprovada pelo botão Testar da Cakto. Procurar `cakto_webhook_diagnostic`. Motivos: `missing_signature_headers` (um header ausente), `invalid_signature_format` (formato incompatível), `timestamp_outside_tolerance` (horário inválido), `signature_mismatch` (HMAC não coincide; não identifica sozinho chave vs bytes), `product_or_offer_rejected` (assinatura válida, IDs não permitidos), `configuration_missing`, `processing_failed` ou `persisted`. Não flexibilizar autenticação nem permitir produto de fixture. Teste do provedor ainda pendente.

## Retomada e integração local em 05/10/2026

Usuário confirmou que o site ainda está somente no computador. Nenhuma URL pública, túnel, deploy ou webhook no painel criado nesta retomada. Entrega real permanece pendente; implementação local pode ser exercitada sem expor o servidor.

Teste `scripts/test-webhook-integration.mjs` aprovado usando aplicação Next com `next start` em loopback 127.0.0.1:3101, build existente e segredo aleatório efêmero somente no ambiente do processo filho. IDs de produto/oferta de fixture sobrescrevem apenas esse processo; `.env.local` e dev server da porta 3000 preservados. Tráfego atravessou rota real, DAL e RPC no Supabase ligado, com fixtures removidas no finally. Segredo não gravado nem impresso.

Confirmados HTTP 200 após persistência real, duas requisições simultâneas idênticas com uma entrada, reembolso posterior como segunda entrada, rejeição 401 de adulteração/timestamp antigo, rejeição 400 de lote V2 com produto estrangeiro sem gravação parcial e ausência de dados pessoais/segredo nos registros pending. Script e lint aprovados; processo de teste encerrado e fixtures removidas. Isso resolve os limites anteriores de HTTP positivo integrado e concorrência entre requisições, mas não prova entrega originada na Cakto nem compatibilidade de uma venda real.

Para repetir a partir da pasta do projeto:

```powershell
npm.cmd run build
npm.cmd run test:webhook:integration
```

Requer porta 3101 livre, `.env.local` configurado e CLI Supabase autenticada. Teste insere somente eventos sintéticos com IDs aleatórios, confere diretamente o banco por Management API e exclui exclusivamente essas fixtures. Não concede acesso nem cria cobranças. Se a limpeza falhar, o script termina com erro e conserva o arquivo SQL da fixture em `supabase/.temp`; não declarar teste concluído nesse caso.

Próxima etapa local prevista: 29 — verificação independente do pagamento. Teste do provedor será retomado depois de URL HTTPS pública e segredo do webhook, mantendo contratação desabilitada até o lançamento.

## Implementação de 03/10/2026

Endpoint `POST /api/webhooks/cakto` em Node, com corpo de até 256 KiB e leitura limitada a três segundos. Assinatura HMAC dos bytes originais, comparação em tempo constante e tolerância de cinco minutos em ambos os sentidos. Headers ausentes/assinatura errada recebem 401; configuração ausente 503; formatos/eventos/produto/oferta rejeitados antes de persistir. Não usa login/cookies como autenticidade do provedor, nem fallback no secret do corpo. Valores recebidos não liberam plano ou alteram cotas.

V1/V2 tratados em lote de até 25 pedidos; aceita apenas eventos comerciais previstos. Normalização guarda evento, pedido, produto, oferta, status, ID de assinatura, referência opaca válida e datas relevantes. Descarta secret, nome, contato, CPF, endereço, cartão, comissões e demais dados do payload; não registra corpo cru em logs. Referência ausente/inválida fica nula, aguardando verificação posterior sem associação por e-mail.

Migration incremental `20261003190000_cakto_webhook_inbox.sql` cria inbox privada com RLS sem policies, sem acesso direto para anon/authenticated/service_role. Apenas RPC service_role de inserção, com validação de campos permitidos. Lote atômico e fingerprint SHA256 do registro sanitizado: repetição é ignorada, evento/status/datas diferentes do mesmo pedido são preservados. Estado fica pending; não há processador nem concessão de acesso nesta etapa. Processamento, recuperação e política de expurgo pertencem às etapas seguintes antes do lançamento.

Resposta 200 somente após persistência. DAL limita a operação a três segundos; falha recebe 503 genérico sem credenciais. A Cakto não reenvia automaticamente erros HTTP, portanto não tratar 503 como mecanismo de recuperação: histórico e reconciliação precisam ser implementados antes de aceitar pagamentos. Uma tentativa com timeout pode já ter gravado; deduplicação torna repetição segura.

Verificações: quatro testes isolados do receptor, um HTTP real e doze regressões Premium/checkout (17 total) aprovados; lint e build/TypeScript aprovados. SQL cobre repetição, eventos distintos do mesmo pedido, rollback de lote inválido, bloqueio de dados privados e ACL/RLS. Migration ensaiada com rollback e dry-run, aplicada e teste SQL repetido com rollback. Teste positivo HTTP com o segredo real e entrega do provedor ainda não realizados; não declarar integração externa concluída.

## Configurar quando houver endpoint público

Para repetir os testes locais em PowerShell:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd run test:webhook
# Com npm.cmd run dev em outro terminal:
npm.cmd run test:webhook:http
```

Esperado: quatro testes isolados e um HTTP aprovados. O teste HTTP sem segredo real confirma rejeição, não recebimento positivo do provedor. Abrir a URL do webhook no navegador recebe 405 porque o receptor aceita somente POST.

No painel **Integrações → Webhooks**, cadastrar o produto permitido, URL HTTPS pública terminando em `/api/webhooks/cakto` e eventos comerciais do receptor. Não usar localhost. Salvar o segredo gerado pelo webhook em `CAKTO_WEBHOOK_SECRET`, somente no ambiente do servidor, sem NEXT_PUBLIC ou envio pelo chat. Esse segredo é diferente de CAKTO_CLIENT_SECRET. Preferir configuração manual no painel; chave OAuth atual read + offers permanece intacta.

Antes de ativar entrega real: testar assinatura dos headers na versão escolhida, produto/oferta presentes e campos/IDs do fixture. O fixture oficial pode conter IDs genéricos e então deve ser rejeitado; conectividade não equivale à validação de uma compra. Se o teste não enviar assinatura, não enfraquecer o receptor para fazê-lo passar. Pedir contrato/fixture compatível ao provedor. Confirmar recuperação de entregas com falha, retenção e verificação independente de pagamentos. Contratação permanece bloqueada.

Os tópicos abaixo registram o planejamento original.

Auditoria final após rollback das fixtures: zero registros na inbox e zero assinaturas. Nenhum evento real recebido ou direito concedido. Concorrência da deduplicação é garantida pela restrição única/on conflict no PostgreSQL; teste com duas conexões simultâneas e teste HTTP positivo integrado não executados nesta etapa.

Atualização comercial: usuário confirmou validade do cupom até 31/10/2026. Horário/fuso ainda não informado; confirmar antes do lançamento. Isso não impede preparar e testar o receptor local sem aceitar pagamentos.

Fontes oficiais consultadas em 03/10/2026: [guia de webhooks](https://docs.cakto.com.br/conceitos/webhooks), [criação de webhook](https://docs.cakto.com.br/api-reference/webhooks/create).

## Contrato do provedor

Entrega POST JSON com secret, event e data; V2 usa lista em data. Headers X-Cakto-Timestamp e X-Cakto-Signature autenticam HMAC-SHA256 com chave do webhook sobre timestamp + ponto + bytes originais do corpo, formato v1=hex. Exemplo oficial usa tolerância de cinco minutos. Segredo é gerado na criação, separado da chave OAuth. Retentativas automáticas são para falhas de rede/timeout, não respostas HTTP de erro. Limite de resposta: oito segundos. Dados contêm identificação de pedido/produto/oferta, sck e informações pessoais que devem ser descartadas. Teste oficial é fixture e não comprova uma venda real.

Criação exige products e seleção de eventos; painel Integrações → Webhooks ou API com write + webhooks. A chave read + offers atual não autoriza essa operação.

## Implementação proposta para a próxima etapa

- Endpoint Node para receber os bytes originais, com limite de tamanho e tempo de leitura.
- Verificação em tempo constante da assinatura e timestamp; sem fallback automático para segredo no corpo.
- Eventos comerciais permitidos, produto permitido e validação do envelope V1/V2 antes de persistir.
- Caixa de entrada privada e durável, contendo apenas campos necessários, sem secret, CPF, cartão ou contato do comprador. Rejeitar formatos sem identidade comercial quando exigida.
- Deduplicar entregas sem perder mudanças posteriores do mesmo pedido: deduplicação não pode usar somente ID de pedido para todos os eventos.
- Confirmar recebimento somente depois de gravar; falhas precisam de recuperação pelo histórico/reconciliação, pois HTTP 500 não garante retentativa do provedor.
- Não conceder Premium na etapa 28. Evento autenticado entra como sinal para consulta independente de pagamento na etapa 29.
- Testes de adulteração de bytes, assinatura inválida, timestamp antigo/futuro, payload excessivo, produto errado, repetição, eventos diferentes do mesmo pedido, V2 e falha de persistência.

## Configuração ainda necessária

Endpoint HTTPS público para teste integrado, segredo real do webhook salvo exclusivamente no ambiente e fixture de teste sanitizada. Não registrar localhost como URL no provedor, não publicar servidor com segredos para capturar eventos e não ampliar permissões da chave atual apenas para pesquisa. Preparar e testar endpoint local antes de pedir configuração do painel. Validade/fuso do cupom de outubro permanece uma pendência comercial da etapa 27.

Estado original antes da implementação: documentação preparada. Estado atual descrito acima; webhook remoto, publicação e concessão de acesso não foram realizados. Trava de contratação preservada.
