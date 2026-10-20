# Validação técnica da Cakto sem compra — 20/10/2026

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
