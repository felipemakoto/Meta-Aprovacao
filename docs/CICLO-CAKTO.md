# Ciclo da assinatura Cakto — etapa 31

Tratamento administrativo implementado em 06/10/2026 e conectado ao comando `npm.cmd run cakto:reconcile`. Não altera telas, não habilita contratação e não cria acesso Premium. O processamento continua manual, com as reservas, limites e novas tentativas da etapa 30.

## Regras implementadas

| Situação consultada na API | Efeito local |
| --- | --- |
| Cancelada, pausada, atrasada, inativa ou expirada | Sincroniza o estado observado e preserva o intervalo já comprovado; a leitura do acesso continua expirando pelo relógio do banco |
| Ativa/reativada/recuperada | Não concede, restaura ou amplia acesso sozinha |
| Pedido recusado, parcialmente pago ou aguardando pagamento | Não concede nem estende acesso; não remove um período anterior pago |
| Reembolso solicitado, em efetivação ou aviso de chargeback | Não revoga por antecipação |
| Pedido `refunded` ou `chargedback`, com data de reversão válida | Revoga somente se esse pedido sustentar o intervalo atual da assinatura; reembolso de pedido antigo não remove intervalo posterior |
| Renovação paga | Confere moeda/valor sem desconto promocional; ausência de moeda vai para revisão, valores divergentes também. Mesmo com valores corretos, fica em revisão até comprovar o período pago |

O provedor documenta `next_payment_date` como uma **estimativa da próxima cobrança**, não como prova do período adquirido. Não se usa essa data para aumentar o acesso, nem se somam trinta dias ao pagamento sem contrato suficiente. Isso mantém uma pendência comercial da etapa 29; não é uma falha de configuração do usuário.

O verificador consulta pedido e assinatura no host oficial. O vínculo à conta vem da evidência verificada da primeira compra e da intenção privada, usando o pedido de origem/assinatura/produto/oferta confirmados pela API. Não associa por e-mail, CPF, segredo do corpo ou referência de webhook. Sem primeira evidência válida, o evento fica em revisão (`subscription_binding_missing`).

Observações antigas não substituem estado mais recente do provedor. Datas iguais também não sobrescrevem a observação anterior. Uma reversão confirmada do pedido atual continua removendo aquele acesso mesmo se o estado da assinatura estiver ativo. Nenhum evento ativo/paid repetido restaura acesso revogado; a concessão futura precisará de novo período comprovado.

## Persistência e execução

Migration `20261006200000_cakto_lifecycle.sql`: tabela privada `cakto_lifecycle_checks` com campos comerciais fixos, RLS, deduplicação e sem acesso direto. RPCs apenas `service_role`. Guarda estado observado, data, ação e vínculo à prova inicial; não guarda corpo bruto, comprador, credenciais ou detalhes de cartão.

`finish_cakto_lifecycle_job` grava observação, sincronização/revogação e conclusão da reserva na mesma transação. A reserva inválida/vencida não conclui o item. Casos temporários seguem a espera e o limite da fila; revisão não é repetida automaticamente.

Os onze eventos adicionais aceitos pelo receptor entram na fila: recusa, reembolso/solicitação, chargeback, cancelamento, renovação/recusa, pausa, retomada, atraso e recuperação. `purchase_approved`/`subscription_created` conservam o caminho da primeira mensalidade. Uma renovação enviada apenas como `purchase_approved` ainda é recusada por esse verificador inicial e fica em revisão; não se presume cobertura de todo formato de evento comercial.

O estado `verified` na fila de ciclo significa **observação conferida**, não pagamento aprovado nem Premium concedido. A prova de pagamento permanece em tabela separada. Não há agendamento automático, concessão de novos períodos ou busca histórica de todas as reversões sem webhook.

## Verificação

Quatro testes Node do ciclo, mais dez regressões de pagamento/reconciliação, passaram. Lint e build/TypeScript aprovados. Migration ensaiada com rollback, dry-run conferido, aplicada e SQL repetido com rollback. SQL cobre vínculo, preservação no cancelamento, deduplicação, observação antiga, reembolso de pedido anterior, revogação do pedido atual, reserva/conclusão, replay após revogação, campos privados e permissões.

O teste integrado usa provedor simulado e banco/RPCs reais. Cria acesso sintético somente para conta aleatória de teste, confirma preservação no cancelamento, revogação no reembolso e ausência de restauração por replay, e remove a conta e todos os registros ao terminar. Não comprova o formato de um pagamento comercial real.

Após a integração: consulta real à Cakto concluída sem falha e sem pedidos, fila vazia. Auditoria de inbox, provas, observações de ciclo, jobs e assinaturas retornou zero em todas as tabelas. Nenhuma concessão comercial ou cobrança. A concessão futura deverá consultar também o histórico de reversão antes de aceitar qualquer período.

Ainda pendentes: contrato monetário/moeda, período pago autoritativo, concessão inicial/renovação, cobertura completa e agendamento antes do lançamento. Não realizar compra para contornar a trava de contratação. Próximo trabalho é a concessão transacional, respeitando essas pendências.

Fontes oficiais consultadas em 06/10/2026: [detalhe de assinatura](https://docs.cakto.com.br/api-reference/subscriptions/retrieve), [estados da assinatura](https://docs.cakto.com.br/api-reference/subscriptions/states) e [detalhe/status do pedido](https://docs.cakto.com.br/api-reference/orders/retrieve).
