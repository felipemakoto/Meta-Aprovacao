# Benefícios Premium — etapa 33

Implementação de 09/10/2026. Os benefícios usam a leitura do período pago da [etapa 32](ACESSO-PAGO-CAKTO.md), calculada pelo relógio do banco para a conta verificada. Status comercial ativo, parâmetros do navegador e campos enviados pelo cliente não concedem benefícios.

## Acesso aos estudos

- Premium com período válido: questões e novos simulados sem limite diário; catálogo completo dos simulados publicados e com questões suficientes, incluindo os modelos por matéria.
- Gratuito: dez novas questões e um simulado rápido de dez questões por dia, com renovação à meia-noite de São Paulo.
- Expiração, reembolso ou intervalo futuro sem cobertura atual: os limites gratuitos e o catálogo gratuito voltam automaticamente na próxima operação. Não exige agendamento.
- Tentativas iniciadas continuam disponíveis até seu próprio prazo, inclusive simulados de matéria após expiração do plano. Respostas, histórico e revisão mantêm seus contratos anteriores.

Tentativas feitas durante o Premium também integram a contagem do dia. Se o plano terminar após mais de dez questões ou um simulado, nenhuma nova vaga gratuita aparece até a virada do dia. A prática continua evitando duplicação pelo identificador da solicitação; retomar um simulado aberto não cria nem consome outra tentativa. Limites técnicos por minuto permanecem: trinta novas questões e cinco novos simulados.

O catálogo Premium nesta etapa é o conjunto de modelos de simulados não gratuitos. Não foi criado um catálogo separado de questões exclusivas. Nenhuma questão ou modelo editorial foi publicado automaticamente; conteúdo em rascunho ou sem questões suficientes permanece indisponível.

## Implementação

Migration `20261009190000_premium_study_benefits.sql`: as funções existentes de saldo/início/catalogação consultam `private.subscription_access`. Mesmos bloqueios por usuário, validações, snapshots e permissões restritas ao servidor. Os implementadores privados continuam sem execução direta por `service_role`, `anon` e `authenticated`.

`/api/limits` retorna `hasPremium`, `accessUntil`, uso do dia e cotas. No Premium, `limit` e `remaining` são `null`, sem número artificial para representar ilimitado. No gratuito, permanecem 10/1. O parser rejeita combinações inconsistentes e remove dados extras. Falhas na consulta não viram saldo gratuito ou ilimitado inventado.

Questões e simulados apresentam “Premium ativo · … sem limite diário”. O saldo é atualizado ao expirar o período, na virada do dia, ao retornar à aba e após uma operação. Mudança de plano solicita atualização do catálogo, preservando o estado da tela; seleção de um modelo removido retorna ao primeiro disponível. Essa informação visual não substitui a autorização de cada operação no banco.

O layout do mockup Premium foi preservado. Apenas a frase de contratação remove a afirmação antiga de que os benefícios não estão implementados. Checkout permanece desativado; preços e campanha não foram alterados.

## Validação

Dezessete testes Node de limites/prática/simulados e cinco HTTP de limites/Premium aprovados, junto de lint, build e TypeScript. Migration ensaiada com rollback, conferida com dry-run e aplicada. Regressões SQL de gratuito, benefícios e períodos pagos aprovadas após aplicação.

SQL de benefícios testa concessão pelo RPC de pagamento, mais de dez questões e três simulados no dia, matéria com vinte questões, conta gratuita isolada, rascunho/conteúdo insuficiente bloqueados, deduplicação, proteção de gabaritos, limite técnico, retorno ao gratuito por expiração/revogação/lacuna, conclusão e revisão de tentativas anteriores e permissões.

Integração concorrente com RPCs reais: a última vaga gratuita aceita uma chamada; concessão sintética permite ultrapassar cotas, duas solicitações diferentes são aceitas e a mesma solicitação/simulado é deduplicada. Expiração bloqueia novas questões gratuitas esgotadas e permite retomar o simulado aberto. Usuário, evidência, períodos, tentativas, questões de teste e função temporária removidos. Nenhuma chamada de cobrança à Cakto.

Atualização da etapa 34: [processamento agendado](AUTOMACAO-CAKTO.md) ativo no Supabase. Antes da comercialização, ainda é necessário validar o contrato externo de pagamentos (especialmente moeda) e organizar/publicar conteúdo revisado. Os testes técnicos não comprovam uma compra real aprovada de ponta a ponta.

Auditoria final: inbox, provas de pagamento/ciclo, fila, assinaturas, períodos e provas de renovação em zero após limpeza. Questões e modelos publicados também em zero, preservando a revisão editorial pendente.
