# Promoção somente antes do primeiro pagamento — etapa 62

Pedido de 17/10/2026: depois que a pessoa pagar a primeira vez, mostrar o preço normal nas telas de planos quando ela estiver sem Premium.

## Comportamento

- Conta sem pagamento confirmado: mantém a oferta inicial enquanto a campanha estiver vigente.
- Conta com pagamento confirmado anterior: mostra **R$ 23,98/mês** (R$ 22,99 + taxa de R$ 0,99), sem preço inicial, texto de promoção ou cupom. O vencimento, cancelamento e reembolso não apagam esse histórico.
- Premium ativo: mantém o preço mensal e a ação de continuar estudando.
- Consulta do histórico indisponível ou inválida: não anuncia desconto. A tela Premium informa erro; a escolha de planos após confirmação mantém preço normal e informa a indisponibilidade da consulta.

A regra vale em `/premium` e `/cadastro/confirmado`. A prévia de desenvolvimento aceita `?state=returning` para conferir uma conta que já pagou; esse parâmetro não é usado em páginas reais e as prévias continuam indisponíveis em produção.

## Origem do histórico e checkout

`private.has_paid_premium_before` considera somente evidência `verified` em `cakto_payment_checks`, vinculada à conta pela intenção privada Cakto. Estado ativo do provedor, tentativa de checkout, mensagem de webhook, verificação em revisão, cookies, metadados editáveis e parâmetros do navegador não constituem pagamento.

A nova RPC `read_subscription_pricing` retorna somente `hasPremium`, `accessUntil` e `hasPaidBefore`, valida conta confirmada e é exclusiva de `service_role`. A RPC de acesso anterior e suas regras permanecem intactas. Não existe novo direito de leitura direta de tabelas.

O checkout do site escolhe a configuração regular para uma conta que já pagou e rejeita cupom na URL regular. A RPC de criação da intenção revalida a elegibilidade no banco, antes de reutilizar ou inserir a intenção, preservando preços históricos e os limites existentes. Uma intenção promocional anterior não é reutilizada como intenção de preço normal.

Esta regra identifica **a mesma conta** do site; não tenta relacionar pessoas por e-mail, CPF ou dispositivo. Não modifica o cupom na Cakto, não impede o uso de links externos diretamente no provedor e não habilita contratação. Webhooks/consulta independente continuam sendo necessários para registrar o primeiro pagamento real. A ausência de provas comerciais na etapa 61 continua pendente.

## Verificação

- 20 testes de oferta, checkout e renderização real das duas páginas, cobrindo conta nova, ex-assinante, histórico inválido e Premium ativo.
- 18 regressões de prontidão, oferta da conta, quiz e processamento de pagamento aprovadas.
- Ensaio SQL da migration com ROLLBACK aprovado; dry-run indicou somente a migration `20261017210000_first_purchase_promotion.sql`.
- Migration aplicada e histórico local/remoto sincronizado. Ensaio SQL repetido contra o esquema aplicado, com ROLLBACK, aprovado. Conferidos isolamento entre contas, histórico após expiração/reversão, rejeição de desconto/cupom para conta que pagou e permissões.
- Lint, TypeScript e build aprovados. Nenhuma compra ou chamada de cobrança na Cakto.

Publicação do commit `5d5263e` confirmada pelo status de sucesso da Vercel. `npm run test:promotion:production` passou no domínio público: conta nova viu a promoção; a mesma conta passou a ver somente o preço normal nas duas telas após inserir prova **simulada e expirada**, inclusive depois de nova entrada. A leitura administrativa confirmou `hasPremium:false` e `hasPaidBefore:true`. Conta e registros temporários foram removidos e a ausência conferida. Não houve chamadas à Cakto, envio de e-mail ou certificação de pagamento comercial.
