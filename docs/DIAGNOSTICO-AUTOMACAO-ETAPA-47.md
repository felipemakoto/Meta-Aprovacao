# Diagnóstico de operação após publicação editorial — 14/10/2026

Consultas somente leitura de metadados, sem consultar a Cakto, disparar processamento, conceder períodos pagos ou modificar agendamentos. A falha é separada da publicação editorial, conferida com sucesso.

Na amostra das últimas seis horas havia dezenove respostas HTTP 200 e sete HTTP 503 `automation_unavailable`. Nenhuma estava marcada como timeout e não havia resposta 401 do worker nessa amostra. Os dois agendamentos estavam ativos e os últimos catorze ticks do agendador haviam concluído com sucesso. Isso confirma o disparo, não o sucesso do processamento interno.

A última falha observada foi em 14/10/2026 às 22:25:02 UTC. A execução terminou aproximadamente 2,3 segundos após o disparo, com resumo `{failed:1}`, sem reserva ativa; havia próxima tentativa prevista para após 22:30:02 UTC. Fila vazia e monitor ativo. O incidente acumulava 88 ocorrências históricas, não necessariamente 88 falhas na janela de seis horas.

O resumo é gravado depois da autenticação e obtenção da reserva. A causa original é descartada em `src/lib/subscriptions/automation.ts:43`; `automation-http.ts:24` converte o erro genérico em HTTP 503. A evidência não permite distinguir falha de API, resposta inválida, limite de requisições, configuração externa ou armazenamento. Uma eventual resposta de autenticação da Cakto também pode terminar nesse erro genérico; não foi atribuído defeito às credenciais do usuário.

Próxima correção técnica recomendada: guardar apenas categoria e fase de uma lista fixa, como `provider_unauthorized`, `provider_rate_limited`, `provider_invalid_response`, `provider_unavailable`, `configuration_missing` e `storage_unavailable`, distinguindo timeout. Preservar a resposta pública genérica e evitar mensagens originais, headers, credenciais, identificadores comerciais ou conteúdo de pedidos. A instrumentação e o diagnóstico externo não foram implantados nesta etapa editorial.

Checkout continua `false`, sem aprovação comercial. A checagem de lançamento apontou seis verificações técnicas verdes de conteúdo/configuração local e uma pendência de operação. Os 500 itens e seis modelos publicados não foram revertidos ou confundidos com evidência de compra.
