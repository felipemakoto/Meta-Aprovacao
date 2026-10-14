# Diagnóstico da automação Cakto — etapa 48

Em 14/10/2026, a rotina passou a distinguir a fase e a categoria de uma falha, preservando a resposta pública genérica `503 automation_unavailable`. O resumo privado e o log da Edge Function recebem somente valores de listas fixas e o status HTTP numérico, quando disponível. Mensagens originais, payloads, credenciais, IDs e dados de compradores não são registrados por esse diagnóstico.

## Implementação e publicação

- `cakto-api.ts` identifica autenticação, listagem, pedido e assinatura. Diferencia demora de oito segundos, falha de transporte, resposta inválida, autenticação recusada e limitação de requisições; mantém as classificações usadas para repetir tarefas.
- `automation.ts` conserva a causa sanitizada ao concluir uma execução com falha. Erros de obtenção da reserva e de armazenamento também são classificados. A tentativa de salvar o resumo não substitui a causa original caso também falhe.
- `automation-diagnostics.ts` projeta somente `phase`, `category`, `operation` e `status`. A exceção pública continua com mensagem fixa.
- A migration `20261014230000_cakto_automation_diagnostics.sql` estende a validação do resumo existente; não cria tabelas nem muda permissões, intervalo de acesso, cursor ou política de repetição. Diagnósticos arbitrários, status inválidos e diagnósticos em conclusões bem-sucedidas são rejeitados. Resumos antigos só com contagens continuam aceitos.
- Migration aplicada e função `cakto-reconcile` publicada como versão 3, ativa. Assinatura temporária e nonce de uso único mantidos. Nenhuma credencial foi alterada.

## Onde consultar

`npm run cakto:automation:status` mostra a última conclusão e seu resumo. Quando houver falha, procurar `summary.diagnostic`. Exemplo sintético: `{"phase":"discovery","category":"provider_rate_limited","operation":"orders_list","status":429}`.

No Supabase: **Edge Functions → cakto-reconcile → Logs**, procurando `cakto_automation_diagnostic`. Esses registros pertencem ao worker Supabase, separados do webhook recebido na Vercel. Uma conclusão posterior pode substituir o último resumo no banco; os logs permitem consultar o diagnóstico daquela execução anterior. Falhas na própria autenticação do endpoint não atravessam o processamento e continuam com HTTP 401.

Fases: `lease`, `validation`, `discovery`, `jobs`, `finish`. As categorias distinguem configuração ausente, autenticação do provedor, limite de requisições, recurso ausente, resposta inválida, indisponibilidade, timeout, armazenamento, estado inválido do worker e falha interna não identificada. O diagnóstico não contém evidência suficiente para aprovar um pagamento.

## Testes e limites

35 testes Node aprovados: 22 de automação/pagamentos/ciclo/reconciliação, 12 de webhook/saúde/prontidão e um HTTP contra a publicação existente. A primeira tentativa deste último encontrou o servidor local desligado; a execução contra o domínio publicado passou, com GET negado e POST sem autenticação rejeitado sem gravar evento.

Seis suítes SQL aprovadas dentro de uma transação com rollback, incluindo a migration candidata: exclusividade, cursor, recuperação, permissões, diagnóstico estrito, pagamento, períodos, ciclo e reconciliação. Comando: `npm run test:automation:diagnostics:sql`. O ensaio mantém a automação anterior ao término, sem trocar o agendamento ou suas credenciais.

Integração com RPCs reais e provedor simulado aprovada: conta temporária recebe trinta dias, renovação antecipada chega a sessenta sem duplicação concorrente, cancelamento preserva o período e reembolso revoga sem restauração por replay. Fixtures removidas com conferência de limpeza. Não houve compra nem cobrança real na Cakto. Lint, TypeScript e build aprovados.

A consulta local de leitura à Cakto respondeu HTTP 200 na autenticação e na listagem, sem pedidos no intervalo. Os valores locais de ID/segredo do worker coincidem com os usados nessa consulta; isso não confirma por si só os valores remotos nem explica a falha intermitente histórica. Nenhuma chave foi rotacionada por suposição.

Os 500 itens e seis modelos publicados na etapa 47 permanecem. `checkoutEnabled:false` continua; pagamento comercial, contrato da moeda/valores, cupom e demais verificações de lançamento ainda exigem evidência real. Testes sintéticos não substituem essa evidência.

## Amostra após a publicação

O Cron disparou a versão 3 em **14/10/2026 às 22:47 UTC** (19:47 em São Paulo). A busca terminou às 22:47:07 UTC com HTTP 200, `lastOk:true`, zero pedidos encontrados/ignorados e sem truncamento; próxima busca prevista após 23:02:07 UTC. Nenhuma configuração do agendamento foi antecipada ou reiniciada para obter esse resultado.

Na consulta de 22:47:44 UTC, ambos os jobs permaneciam ativos e a fila estava vazia. Inbox, provas de pagamento, jobs, assinaturas, períodos e renovações estavam em zero após a limpeza das fixtures. Havia 500 questões publicadas e seis modelos publicados. A janela móvel de seis horas continha 21 respostas 200 e seis 503, todas anteriores à nova versão no caso dos 503; nenhuma estava marcada como timeout. Essa janela mudou desde a amostra da etapa 47, portanto as contagens não devem ser comparadas como um total acumulado.

A checagem de saúde e os sete indicadores técnicos de lançamento passaram nesse instante. Aprovação comercial e checkout continuam false. **A origem da intermitência histórica não foi reproduzida nem comprovada**: uma execução bem-sucedida não demonstra eliminação definitiva do problema. A perda da causa no catch genérico foi corrigida e publicada; se a falha reaparecer na descoberta ou no fechamento, haverá categoria/operação/status no resumo privado e no log. Erros recuperados individualmente dentro da fila continuam sujeitos aos resultados e às classificações próprias desses jobs; não são uma falha global de descoberta.
