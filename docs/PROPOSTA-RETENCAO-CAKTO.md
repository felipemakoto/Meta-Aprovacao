# Proposta técnica de retenção — Cakto

Estado: proposta para avaliação; nenhum descarte, cron ou alteração de banco implementado. Não estabelece prazo legal para documentos financeiros. Checkout permanece desativado.

## Regra de preservação

O schema atual contém exclusões em cascata: checkout_intents → cakto_payment_checks → cakto_access_periods/cakto_renewal_payments/cakto_lifecycle_checks; cakto_event_inbox → checks/jobs. Portanto, uma intenção vencida ou um evento antigo não são, isoladamente, descartáveis. Os identificadores únicos também impedem o reprocessamento e a concessão duplicada de acesso.

Não aplicar DELETE por idade às tabelas atuais. Uma política futura precisa preservar referências, chaves de deduplicação, períodos de acesso, cancelamentos e reversões antes de qualquer remoção. Conta encerrada não equivale a autorização para apagar evidência financeira ou contornar essas dependências.

## Prazos operacionais propostos

| Categoria | Proposta | Condição obrigatória |
| --- | --- | --- |
| Intenções vencidas sem vínculo com pagamento | Avaliar após 30 dias do vencimento | Demonstrar ausência de referências, pedidos, verificações e tarefas; avaliar eventos atrasados e manter proteção contra replay. Não executar com o schema atual sem revisão. |
| Histórico técnico de execuções concluídas | Avaliar após 90 dias | Somente registros operacionais sem função na deduplicação, no acesso ou na auditoria financeira; preservar falhas abertas/incidentes e não interferir em outros jobs do projeto. |
| Eventos, checks, renovações, períodos e vínculos de assinatura | Sem descarte automático nesta etapa | Definir prazo financeiro com responsável e orientação contábil/jurídica; projetar separação entre evidência mínima e detalhes técnicos antes de automatizar. |
| Revisões pendentes, reembolsos, chargebacks ou disputas | Suspender qualquer descarte | Resolver o caso e documentar a liberação; idade do registro não encerra a pendência. |
| Backups | Política separada ainda a definir | Não excluir cópias nesta tarefa. Mapear expiração e restauração para que uma recuperação não reintroduza dados já descartados legitimamente. |

30 e 90 dias são propostas operacionais, não exigências legais nem configurações atuais. A proposta não inclui novos dados pessoais ou cópias de payloads completos.

## Critérios antes de implementar

1. Inventário agregado e simulação somente leitura do conjunto elegível, sem exibir compradores ou segredos.
2. Prazo financeiro definido e política de privacidade coerente com o tratamento efetivo.
3. Revisão de todas as dependências e deduplicação; nenhum evento repetido pode restaurar acesso revogado ou gerar novo período.
4. Backup verificado, restauração planejada, execução limitada e registro agregado da operação.
5. Testes com fixtures: acesso vigente preservado, renovação e reembolso preservados, replay bloqueado, pendências excluídas do descarte.

## Contrato do provedor ainda pendente

Atualização posterior: [validação da moeda e adaptação do leitor](VALIDACAO-CAKTO-SEM-COMPRA-2026-10-20.md). Produto/oferta documentam currency; a oferta real retornou BRL e há fallback autenticado implementado. O pedido de esclarecimento abaixo é histórico e não precisa bloquear essa adaptação. Fuso do cupom permanece uma incerteza documentada; nenhuma mensagem foi enviada.

Consulta à documentação via Context7 em 20/10/2026: [Obter pedido](https://docs.cakto.com.br/api-reference/orders/retrieve) documenta valores decimais e datas de validade do cupom, mas não confirma moeda do pedido nem fuso do campo endTime. A configuração visual BRL do cupom e os exemplos de timestamps com offset não provam esses contratos. Manter currency_unconfirmed quando faltar evidência de moeda.

Solicitação pronta para o suporte, ainda não enviada:

> Precisamos concluir a integração sem realizar uma compra. No GET /public_api/orders/{id}/, qual campo ou consulta autenticada confirma a moeda do pedido? O schema publicado não lista currency. Caso a moeda venha do produto ou da oferta, poderiam indicar o endpoint, campo e permissão necessários e confirmar se essa moeda também vale para as renovações? Além disso, qual fuso o painel usa para salvar e interpretar endTime dos cupons? Nosso cupom está configurado para terminar em 31/10/2026 às 23:59; precisamos confirmar o instante correspondente no horário de Brasília. Podem responder com a documentação ou um exemplo fictício sem dados pessoais ou segredos?
