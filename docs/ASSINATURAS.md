# Etapa 25 — modelo privado de assinaturas

Implementada em **02/10/2026**. Após comparar alternativas, o usuário escolheu manter a **Kiwify**, pois já tem cadastro, e autorizou continuar a etapa 25. Checkpoint anterior: fb0e8bc. Esta etapa prepara o banco; a página Premium fica na etapa 26, checkout na 27 e validação de pagamento nas etapas seguintes.

## O que foi criado

Migration `20261003000521_create_private_subscriptions.sql`, aplicada no Supabase de desenvolvimento `clxnqrkdalimrqcnhegr`. O prefixo foi gerado pela CLI em UTC, já em 03/10; a data local da execução é 02/10. Doze migrations locais/remotas sincronizadas.

Tabela `private.subscriptions`:

| Campos | Finalidade |
| --- | --- |
| id, user_id | Identidade interna e proprietário; FK para Auth com exclusão em cascata |
| provider, external_subscription_id | Kiwify e identificador comercial único por provedor |
| external_product_id, external_plan_id | Produto obrigatório; plano opcional até confirmar o contrato real |
| provider_status | Estado observado do provedor, sem presumir um enum ainda não confirmado |
| access_state | Estado local: unverified, granted ou revoked |
| access_from, access_until | Intervalo verificado de acesso, com início inclusivo e fim exclusivo |
| last_verified_order_id, last_verified_at | Última ordem validada e data dessa validação |
| last_synced_at | Data de sincronização; sincronizar não comprova pagamento |
| created_at, updated_at | Datas internas; atualização mantida por trigger |

Uma conta pode ter mais de uma assinatura, inclusive histórica. A identidade da assinatura, proprietário, produto e criação não podem ser alterados por UPDATE. O plano pode mudar no futuro, após validação específica. Identificadores vazios, datas infinitas e intervalos invertidos/vazios são rejeitados. Não há coluna de payload bruto, CPF, cartão ou e-mail do comprador.

## Direito de acesso

Sem registro, o acesso é negado. O padrão de uma nova assinatura é `unverified`, sem período nem evidência de validação. `granted` e `revoked` exigem intervalo, ordem validada, data de validação e sincronização. Essas restrições impedem registros incompletos; **não substituem a consulta oficial da compra** que será implementada na etapa 29.

`public.read_subscription_access(uuid)` exige conta com e-mail confirmado e devolve apenas `hasPremium` e `accessUntil`. O resultado considera exclusivamente períodos `granted` já iniciados, ainda não expirados e cuja validação não esteja no futuro, usando o relógio do banco. Entre períodos vigentes da conta, devolve o maior fim. Assinatura revogada ou futura não esconde outra assinatura válida.

O estado informado pelo provedor não concede nem retira acesso sozinho. Cancelamento pode conservar o período pago; revogação local remove aquele direito. O vencimento passa a negar acesso automaticamente, sem depender de cron ou de um evento posterior. Não existe tolerância de atraso inventada.

O índice de ordem impede repetir a **última ordem registrada** em duas assinaturas. Não é um histórico completo: deduplicação de todas as ordens/eventos, reembolsos, precedência e aplicação transacional serão construídos com `payment_events` nas etapas correspondentes. Nenhum webhook ou RPC de escrita foi criado aqui.

## Proteções

RLS habilitado sem policies de liberação. PUBLIC, anon, authenticated e service_role não têm acesso direto à tabela. Funções privadas também não podem ser executadas por esses papéis. Apenas service_role executa a RPC pública de leitura, seguindo o padrão existente do projeto.

O servidor futuro deve verificar a sessão e fornecer o UUID autenticado; a RPC é privilegiada e não deve receber um UUID arbitrário do navegador. Ela não está conectada a rota HTTP nem às telas nesta etapa. As cotas gratuitas continuam em vigor para todos; nenhum pagamento ou Premium foi ativado.

Os nomes adicionais são convenções internas, não campos presumidos do payload Kiwify. Mapeamento de estados, período pago, produto/plano permitido, referência do checkout e autenticidade dos eventos continuam com as pendências de [KIWIFY.md](KIWIFY.md).

## Verificação realizada

- Migration e teste executados primeiro juntos em uma transação com rollback, antes da aplicação definitiva.
- Dry-run apresentou somente a migration nova; db push aplicou-a e migration list confirmou as doze versões sincronizadas.
- `test_subscriptions.sql`: acesso padrão, conta não confirmada/ausente/excluída, isolamento entre contas, período pago após cancelamento, revogação, expiração/futuro, intervalos inválidos, evidência obrigatória, identidade imutável, duplicação, múltiplas assinaturas, updated_at, RLS e permissões. Fixtures desfeitas por rollback.
- `test_free_limits.sql`: regressão dos limites diários, repetição segura, retomada, revisão, fuso e permissões passou.
- `verify_subscriptions.sql`: auditoria somente de leitura. Na conclusão, zero assinaturas e zero questões publicadas; nenhum usuário recebeu Premium.

Nenhum código Next.js, interface ou dependência alterado; lint/build não repetidos para esta etapa de SQL/documentação. Git versiona o schema e os testes, não faz backup dos dados remotos.

## Como repetir no PowerShell

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npx.cmd --no-install supabase migration list --linked
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_subscriptions.sql
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_subscriptions.sql
git log -1 --oneline
git status
```

Esperado: migration 20261003000521 nas duas colunas; quatro indicadores de segurança true; teste funcional `subscriptions_access_ownership_constraints_privileges_passed=true`; Git sem alterações pendentes após o checkpoint. Não existe tela nova nesta etapa. Próximo passo: etapa 26 — mockup Premium, definição de preço/frequência/benefícios e aprovação antes de implementar.
