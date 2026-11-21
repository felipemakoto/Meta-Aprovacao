# Lançamento Premium — 20/10/2026

Responsável autorizou explicitamente habilitar a contratação e definir a retenção. Compra real e confirmação do fuso foram dispensadas; horários, preços, limites, permissões de acesso e provedor preservados.

## Publicação e comportamento

Commit publicado: e7213c36ac522ba395c7839e1c30c9beb618e79d, statusVercelsuccess. checkoutEnabled=true. As telas Premium e pós-cadastro mostram Assinar Premium; prévias continuam sem contratar. Premium ativo mantém ação de estudo e não oferece nova contratação.

O botão envia POST vazio com Accept:application/json; a resposta contém somente destino validado após salvar intenção privada. Autenticação, origem, status Premium e histórico de pagamento continuam conferidos no servidor. O cliente não fornece preço, produto, usuário ou cupom. Estado ocupado impede cliques concorrentes; falhas aparecem junto à ação. O modo303existente foi preservado para clientes sem AcceptJSON.

## Evidências concluídas

-43testes unitários relacionados aprovados:23de promoção/checkout/ação de interface e20de prontidão/cadastro/publicação editorial. Lint dos arquivos alterados e build/TypeScript passaram.
- Sete indicadores de lançamento aprovados na consulta final: operação, diagnóstico, prática, simulado rápido gratuito, catálogo Premium, matéria Premium e configuração local de checkout.
- Script de produção autenticou conta aleatória descartável, conferiu planos em Premium/pós-cadastro e gerou destino promocional com referência privada. Depois simulou somente no banco dessa fixture um histórico pago expirado, conferiu preço normal, destino sem cupom e nova entrada. Nenhuma chamada de cobrança ou consulta de pedidos na Cakto. Conta e todos os registros associados removidos, ausência conferida.
- Navegador em sessão existente mostrou Assinar Premium, R$12,49 inicial e R$23,98mensais; clicar abriu pay.cakto.com.br com cupom e referência de intenção. Checkout mostrou total promocionalR$12,49. Nenhum campo de comprador/cartão foi preenchido nem botão de pagamento acionado. A intenção legítima criada nesse fluxo não foi apagada; segue a expiração normal. Aba de conferência encerrada ao terminar.
- Captura da tela Premium antes da navegação salva localmente em meta-premium-liberado-20261020.jpg, no diretório temporário do perfilWindows; não contém referência de checkout ou dados de comprador.
- Console observou duas mensagens opacasNaN com origemchallenges.cloudflare.com durante a visita ao checkout. Não foram atribuídas ao código da Meta Aprovação nem impediram a navegação; não se declara ausência absoluta de mensagens de terceiros.
- Privacidade publicada respondeuHTTP200 e mostrou versão2026-10-20.1, prazo financeiro e revisão controlada.

## Retenção definida

POLITICA-RETENCAO.md substitui a proposta anterior:30dias para intenções vencidas sem vínculo,90dias para histórico técnico/backups e5anos após encerramento da assinatura para evidência financeira necessária. São marcos operacionais de revisão/descarte, não prazo legal universal. Disputas, incidentes e obrigações justificadas suspendem o descarte necessário.

Limpeza controlada por revisão administrativa: não foi criado cron, migração ou rotina de DELETE; nenhum dado de usuário ou backup foi removido ao definir a política. Uma execução futura deve conferir vínculos/cascatas, deduplicação, finalidade e cópia restaurável. A remoção das fixtures pertence exclusivamente ao teste descartável acima.

Não houve transação comercial e não há certificação de aprovação de compra real. WorkerSupabase permanece versão5, sem mudança de credenciais/permissões/agendamentos nesta entrega.
