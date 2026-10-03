# Etapa 28 — contrato conferido, implementação pendente

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

Estado: documentação preparada; nenhum endpoint, migration de inbox, webhook remoto, publicação ou concessão de acesso criado. Trava de contratação preservada.
