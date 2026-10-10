# Automação Cakto — etapa 34

Atualização em 10/10/2026 — etapa 35: [diagnóstico e monitoramento](MONITORAMENTO-CAKTO.md) ativos no banco, com registro privado de condições e comando `cakto:health`. A ausência de monitor mencionada no relato inicial abaixo foi resolvida para consulta/registro interno; não há envio de alertas externos.

Implementada e ativada em 09/10/2026 no Supabase. O computador e o servidor local não precisam ficar ligados. Nenhuma página, preço, cobrança ou configuração de checkout foi alterada. A contratação continua desabilitada enquanto o contrato externo de pagamento e o conteúdo revisado não forem validados.

## Funcionamento

O Supabase Cron verifica a fila a cada minuto. Só chama a Edge Function `cakto-reconcile` quando existe trabalho elegível ou uma busca de pedidos está prevista. Sem trabalho, o tick faz apenas a verificação no banco; não consulta a Cakto nem invoca a função. Não depende do agendamento da Vercel.

Uma execução reserva a rotina por dois minutos e processa até dois itens, respeitando um orçamento de noventa segundos e as reservas individuais existentes. Instâncias concorrentes não processam a mesma reserva; reserva vencida pode ser retomada. Falhas temporárias seguem a espera progressiva e o limite de oito tentativas da reconciliação. Itens em `review` ou `exhausted` exigem análise administrativa.

A busca independente consulta pedidos criados nos últimos sete dias, em uma janela fixa por varredura. Cada chamada consulta uma página de até cinco identificadores e analisa um pedido; página e posição ficam persistidas. Avança até cem páginas, registra `truncated` se houver mais e começa nova varredura quinze minutos depois de terminar a anterior. Falha conserva o cursor e espera cinco minutos. Durante uma varredura, o próximo trecho fica previsto para um minuto depois; a fila pode ser processada entre esses trechos.

A listagem fornece somente sinais. Pedido e assinatura são consultados novamente; primeira mensalidade exige intenção privada da conta, e renovação exige vínculo à primeira evidência. Produto/oferta, moeda BRL, valores, status pago e sequência continuam obrigatórios. Ausência de moeda ou divergência vai para revisão. A persistência e a concessão de trinta dias continuam transacionais e deduplicadas; esta etapa apenas agenda os verificadores existentes.

## Proteção e configuração

O destino é fixo no projeto Supabase. A função não aceita IDs, modos, planos ou parâmetros do navegador: somente POST com corpo `{}`. A autorização usa HMAC-SHA256, horário com tolerância de noventa segundos e nonce aleatório consumido uma única vez por RPC exclusiva de `service_role`. Assinatura inválida, expirada ou repetida recebe 401. A configuração e os registros de reserva ficam privados, sem acesso direto dos clientes.

A chave permanente `CAKTO_WORKER_SECRET` fica no Supabase Vault e nos secrets da Edge Function; as credenciais de leitura `CAKTO_CLIENT_ID` e `CAKTO_CLIENT_SECRET` ficam nos secrets da função. Cópia local em `.env.cakto-worker.local`, ignorada pelo Git. Não colocar esses valores em variáveis `NEXT_PUBLIC`, URLs, arquivos versionados ou mensagens.

As tabelas internas do `pg_net` pertencem a `supabase_admin` neste projeto e possuem permissões públicas que o papel administrativo `postgres` não conseguiu revogar. A migration `20261009210000` registra essa tentativa; não representa uma proteção efetiva dessas tabelas. A migration `20261009220000` substitui o envio da chave permanente por autorização temporária assinada. A fila HTTP contém apenas essa autorização descartável; a chave permanente não passa por ela. A assinatura só permite executar o trabalho fixo já autorizado, uma vez, sem parâmetros comerciais.

O gateway JWT da função está desativado porque o dispatcher usa essa autenticação própria, verificada antes de qualquer processamento. A função não expõe respostas brutas, dados do comprador, credenciais ou evidências; retorna somente modo e contagens. Logs `cakto_automation` também contêm apenas esse resumo. Não existe configuração nova necessária na Vercel.

## Operação

Na pasta atual do projeto, com `.env.local` já configurado:

```powershell
npm.cmd run cakto:automation:status
npm.cmd run cakto:automation:pause
```

O primeiro mostra ativação, execução em andamento, último resultado, cursor e próxima busca. O segundo pausa novos disparos e preserva os períodos pagos; uma execução já iniciada pode terminar. Não apaga a fila.

Reativação administrativa após conferência da configuração:

```powershell
node --env-file=.env.local scripts/configure-cakto-automation.mjs activate
```

O job `meta-cakto-reconcile` aparece no Supabase Cron. Os logs da função ficam em **Edge Functions → cakto-reconcile → Logs**, no Supabase, separados dos logs do webhook na Vercel. O estado `lastOk:true` confirma a conclusão daquela execução; resumo de zero pedidos não comprova uma venda real. Verificar também contagens `review`/`exhausted` da fila e a data da última conclusão; esta etapa não envia alertas externos.

Para uma instalação nova: aplicar as três migrations da etapa, executar os modos `secrets` e `configure` do script administrativo, publicar a função e executar `smoke` com a automação pausada. Só então ativar. Não ativar a migration inicial isoladamente: o transporte final exige a migration de assinatura temporária e a função atual. O modo `configure` não pausa uma instalação ativa; pausar antes de trocar credenciais. Em rotação, atualizar secrets e Vault com a mesma chave antes de reativar.

## Verificação realizada

Dezoito testes Node de automação, pagamentos, reconciliação e ciclo aprovados; testes SQL com rollback confirmaram exclusividade, cursor, retomada, falhas, permissões e consumo único/expiração do nonce. Integração com banco real e provedor simulado confirmou dois workers concorrentes, primeira mensalidade e renovação totalizando sessenta dias; fixtures removidas. O script de integração recusa automação já configurada/ativa e deve ser usado em ambiente de teste isolado, não nesta instalação ativa.

Função publicada: chamadas sem assinatura/corrompidas receberam 401; chamada assinada válida durante pausa recebeu 200 sem processamento e repetição recebeu 401. Após ativação, o Cron disparou a função automaticamente, a consulta real da Cakto terminou com HTTP 200, zero pedidos, `lastOk:true` e próxima busca quinze minutos depois. Nenhuma cobrança foi criada. Compilação Next/TypeScript, lint e verificação Deno aprovados.

Auditoria final: três ticks do Cron concluídos com sucesso e somente uma chamada HTTP, confirmando que a fila vazia não gera invocações adicionais. Inbox, provas de pagamento/ciclo, jobs, assinaturas, períodos e renovações permaneceram em zero; não restaram dados de teste.

## Limites antes do lançamento

A janela usa criação do pedido, não é uma recuperação histórica completa de pagamentos muito tardios ou de interrupção superior a sete dias. Varreduras têm teto de quinhentos pedidos e podem demorar com volume alto; precisam ser ampliadas antes de exceder esse volume. Não existe teste de pagamento comercial positivo, contrato real da moeda ainda precisa de confirmação, e conteúdo editorial permanece em rascunho. Contratação continua `enabled:false`.

Fontes oficiais: [agendamento de Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions), [Vault](https://supabase.com/docs/guides/database/vault), [limites de execução](https://supabase.com/docs/guides/functions/limits). A frequência, o processamento em lotes e a regra de acesso são decisões locais do Meta Aprovação. Histórico em [RECONCILIACAO-CAKTO.md](RECONCILIACAO-CAKTO.md), [ACESSO-PAGO-CAKTO.md](ACESSO-PAGO-CAKTO.md) e [BENEFICIOS-PREMIUM.md](BENEFICIOS-PREMIUM.md).
