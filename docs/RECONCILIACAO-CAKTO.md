# Reconciliação Cakto — etapa 30

Implementação administrativa em 06/10/2026. Recupera processamentos interrompidos e procura primeiras mensalidades pagas sem webhook recebido. Consulta a API novamente e usa o verificador da etapa 29; não concede Premium. Contratação permanece bloqueada.

## Execução local

No PowerShell, na pasta do projeto, com as credenciais já guardadas no `.env.local` ignorado:

```powershell
npm.cmd run cakto:reconcile
```

Cada execução busca até cinco pedidos e processa até cinco itens da fila. O resultado mostra somente contagens, estados e se há outra página; não imprime credenciais, referências, dados do comprador ou respostas brutas. A falha na busca não impede a tentativa dos itens já persistidos.

Quando `discovery.hasMore` for verdadeiro, a próxima página pode ser consultada explicitamente:

```powershell
npm.cmd run cakto:reconcile -- 2
```

Páginas de 1 a 100 são aceitas. A janela vem do relógio do banco: pedidos criados nos últimos sete dias, ordenados do mais recente. Cada execução recalcula a janela; não é uma varredura histórica completa nem um cursor estável entre execuções. Muitos pedidos ou pagamentos tardios exigirão ampliar esse mecanismo antes do lançamento. URLs de paginação retornadas pelo provedor nunca recebem o token; a consulta é reconstruída no host oficial.

Não há cron, agendamento, rota pública de administração ou processamento em segundo plano. Novas tentativas só acontecem quando este comando é executado e o intervalo já venceu. A publicação na Vercel não inicia o comando.

## Fila e recuperação

- A inbox mantém a origem `webhook` ou `api_reconciliation`. Uma consulta não é registrada como webhook autenticado.
- A descoberta exige pedido e assinatura consultados independentemente, produto/oferta permitidos, primeira mensalidade paga e referência correspondente a uma intenção privada de conta confirmada. Identificadores são apenas sinais; o processamento consulta o provedor novamente antes da evidência.
- Somente `purchase_approved` e `subscription_created` entram nesta fila. Renovação, cancelamento e demais eventos aguardam o tratamento do ciclo de assinatura.
- Cada worker reserva um item por vez. A reserva dura dois minutos no relógio do banco. Workers simultâneos usam bloqueio de linha; a reserva vencida pode ser retomada, e a anterior não pode concluir o item depois disso.
- A evidência e o estado final são gravados na mesma transação. Falha na gravação preserva a possibilidade de recuperação.
- Falhas temporárias recebem espera de 60, 120, 240, 480, 960, 1920 e 3600 segundos entre tentativas. Após a oitava tentativa sem conclusão, o item fica `exhausted` e aparece na contagem.
- `review` e `exhausted` não são repetidos automaticamente. A RPC administrativa `requeue_cakto_payment_job` permite recolocá-los na fila depois da análise/correção, sem permitir reabrir itens verificados ou em processamento. Não há botão público para isso.

Migration `20261006190000_cakto_reconciliation.sql` aplicada após ensaio com rollback e dry-run. Tabela privada com RLS e sem acesso direto; RPCs executáveis apenas por `service_role`. Nenhum período de assinatura, limite diário ou página foi alterado.

## Verificações

Três testes Node de reconciliação e sete de pagamentos aprovados, além de lint/build. SQL remoto com rollback confirmou deduplicação da descoberta, intervalo de repetição, retomada de reserva vencida, rejeição de reserva antiga, revisão e esgotamento. Integração com banco real e provedor simulado confirmou reserva única entre dois workers, conclusão repetida rejeitada e limpeza das fixtures.

Execução real em 06/10/2026: busca autenticada sem falha, nenhum pedido encontrado, zero itens processados e todas as contagens da fila em zero. Auditoria posterior: inbox, evidências, jobs e assinaturas em zero. Nenhuma cobrança efetuada. Esse resultado confirma a comunicação e a fila vazia; não confirma o contrato de um pedido comercial real.

## Pendências antes da liberação

O detalhe de pedido documentado não informa moeda. O verificador permanece conservador: moeda ausente vai para revisão (`currency_unconfirmed`). Valores, referência e demais campos precisam de confirmação autoritativa com um pedido real ou contrato oficial suficiente; a descoberta não ignora essa exigência. Evidência candidata não equivale à concessão de acesso.

Ainda faltam ciclo de assinatura, concessão/revogação transacional, agendamento, cobertura histórica completa e validação comercial integrada. A etapa 29 conserva essa pendência; esta etapa entrega a reconciliação manual limitada.

Fontes oficiais: [listagem de pedidos](https://docs.cakto.com.br/api-reference/orders/list), [detalhe de pedido](https://docs.cakto.com.br/api-reference/orders/retrieve) e [detalhe de assinatura](https://docs.cakto.com.br/api-reference/subscriptions/retrieve). Contrato da evidência em [VERIFICACAO-CAKTO.md](VERIFICACAO-CAKTO.md).
