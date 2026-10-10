# Monitoramento Cakto — etapa 35

Implementado e ativado em 10/10/2026. Diagnóstico administrativo e registro automático de condições operacionais, separados do processamento de pagamentos. Páginas, preços, checkout e períodos pagos preservados. Não envia e-mails, mensagens ou notificações externas.

## Como consultar

Abra o PowerShell na pasta atual do projeto e execute:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\cakto\projeto_etec-if'
npm.cmd run cakto:health
```

O resultado mostra se a operação funciona, está pausada ou precisa de atenção, a última conclusão em horário de São Paulo e as contagens da fila. Não precisa abrir os logs da Vercel para usar esse diagnóstico. As credenciais já ficam no `.env.local` ignorado; não copiar valores para o chat.

Para consultar o registro agregado e os horários de incidentes:

```powershell
npm.cmd run cakto:health -- --json
```

Saída 0 significa leitura saudável ou pausa intencional sem pendências. Saída 2 indica atenção operacional ou monitor desatualizado; saída 1 significa diagnóstico indisponível. Falha de consulta não é apresentada como fila vazia. O comando só lê dados; não tenta cobrar, reprocessar ou liberar acesso.

## Condições acompanhadas

| Condição | Quando aparece | Ação administrativa |
| --- | --- | --- |
| Agendamento desativado | Processador habilitado, mas seu job está ausente/inativo | Conferir o job `meta-cakto-reconcile` no Supabase Cron |
| Busca atrasada | Busca prevista há mais de cinco minutos, sem reserva vigente | Conferir execução da Edge Function e do job |
| Última execução falhou | `lastOk:false`, enquanto o processador está habilitado | Conferir logs `cakto_automation` e configuração |
| Fila parada | Sinal ou tarefa elegível espera há mais de dez minutos | Conferir reservas, fila e funcionamento do processador |
| Revisão necessária | Há itens `review` | Investigar moeda, valores, sequência e vínculo antes de recolocar na fila |
| Tentativas esgotadas | Há itens `exhausted` | Corrigir a causa antes de usar a RPC administrativa de recolocação |

O relógio de fila começa na elegibilidade: espera progressiva futura não é confundida com paralisação. Reservas expiradas aparecem na contagem e, se aguardarem mais de dez minutos, no aviso de fila. Produto/oferta fora da configuração atual não entram no relatório. Pausar o processador evita avisos de paralisação/falha relacionados à pausa, mas não oculta itens em revisão ou esgotados.

O comando também pede atenção quando o monitor está inativo ou a última amostra tem mais de três minutos. Se todo o Cron parar, ele não poderá registrar novos incidentes sozinho; a consulta manual detecta a amostra antiga. Não existe serviço externo de disponibilidade nesta etapa.

## Registro e privacidade

O job `meta-cakto-health` executa `private.capture_cakto_health()` a cada minuto, apenas dentro do banco, sem chamadas à Cakto ou à Edge Function. Cada condição usa uma linha: primeiro/último horário, resolução e número de recorrências. Amostras repetidas mantêm o primeiro horário e não aumentam a recorrência; resolução seguida de reaparecimento inicia outro episódio. Isso mantém no máximo seis registros de condições e uma linha de controle, sem crescimento a cada tick. O registro conserva somente o episódio mais recente de cada condição, não um histórico completo de incidentes.

Tabelas privadas com RLS e sem leitura/escrita direta por clientes ou `service_role`. A única RPC de leitura, `cakto_operational_health`, exige `service_role`, não recebe parâmetros e retorna somente contagens, estados, códigos fixos e horários. Funções internas de captura/consulta não podem ser executadas pelo cliente nem pela chave de serviço. O script valida e projeta a resposta antes de imprimir; campos extras e respostas brutas não são exibidos.

Este monitor não apaga inbox, intenções de checkout, evidências, assinaturas ou períodos pagos. A política de retenção financeira e a limpeza do histórico geral do Cron continuam pendentes antes do lançamento. Ausência de incidentes não comprova uma compra, o formato real da API ou disponibilidade contínua do provedor.

## Instalação e verificação

Migration `20261010180000_cakto_operational_health.sql` ensaiada junto dos testes com rollback, conferida por dry-run e aplicada. `supabase/tests/test_cakto_operational_health.sql` aprovado novamente após aplicação: pausa, funcionamento normal, job inativo, reserva vigente/vencida, busca parada, falha, repetição/resolução/recorrência, atraso de retry, revisão/esgotamento, isolamento de oferta e permissões. Fixtures foram revertidas, preservando a operação real.

Três testes Node aprovados: projeção sem campos privados, rejeição de contrato inválido e diagnóstico de pausa/atenção/monitor desatualizado. Lint e TypeScript aprovados. Integração real pela Data API confirmou leitura administrativa e bloqueio anônimo, sem alterar dados comerciais. O comando real informou operação normal e fila vazia.

O Cron executou o monitor automaticamente. Durante a conferência, uma execução do worker retornou 503 em cerca de oito segundos; `lastOk:false` foi registrada como `automation_failed`, sem duplicar o incidente nas amostras seguintes. Uma consulta local de leitura à Cakto respondeu normalmente logo depois, com zero pedidos. Isso sugere falha pontual da consulta, mas não identifica sua causa; não foi enfraquecida a verificação nem substituída a consulta real por um resultado simulado.

A tentativa automática seguinte recebeu 200, zero pedidos e `lastOk:true`, recuperando a operação sem intervenção na fila. Auditoria: inbox, evidências, jobs, assinaturas, períodos e renovações em zero, sem fixtures restantes. O monitor conserva a ocorrência para consulta, mesmo depois de a condição desaparecer.

Após os testes, o job foi ativado pelo arquivo `supabase/operations/enable_cakto_health.sql`. Em uma instalação nova, aplicar a migration e testar antes de executar:

```powershell
npx.cmd supabase db query --linked --file supabase/operations/enable_cakto_health.sql
```

Esse arquivo configura apenas o monitor; não ativa pagamentos nem checkout. Para pausar o processamento de pagamentos, continua disponível `npm.cmd run cakto:automation:pause`. O monitor pode continuar acompanhando a fila durante a pausa.

Fontes oficiais: [Supabase Cron](https://supabase.com/docs/guides/cron) e [permissões de funções no banco](https://supabase.com/docs/guides/database/functions). Os limites de cinco/dez/três minutos são critérios locais de operação, não garantias de SLA da Cakto. Guias relacionados: [AUTOMACAO-CAKTO.md](AUTOMACAO-CAKTO.md) e [RECONCILIACAO-CAKTO.md](RECONCILIACAO-CAKTO.md).
