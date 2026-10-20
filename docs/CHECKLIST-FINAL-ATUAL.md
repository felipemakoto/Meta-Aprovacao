# Checklist final vigente — Meta Aprovação

Atualizado em20/10/2026. Este arquivo substitui listas históricas de pendências nos relatórios anteriores, preservados como evidências. Uma verificação concluída não garante disponibilidade permanente.

| Área | Estado vigente |
| --- | --- |
| Site e interface | Publicados; verificações anteriores de navegação, responsividade, build e tipos aprovadas. |
| Cadastro, e-mail, login e recuperação | Fluxos validados conforme CADASTRO-EMAIL-ETAPA-63.md e RECUPERACAO-ATUALIZADA-ETAPA-64.md. Não exigir novo cadastro real nesta etapa. |
| Questões e simulados |500 questões publicadas com gabarito; diagnóstico, prática e modelos gratuitos/Premium disponíveis na última checagem. |
| Contrato monetário | Oferta autenticada retornouBRL; primeira cobrança e renovação usam fallback autenticado quando o pedido REST omite currency. Moeda explícita conflitante nunca é substituída. |
| Webhook e assinatura | Entrega fictícia do provedor recebeu200; ensaios de persistência, concorrência, acesso, renovação, cancelamento, reembolso e replay aprovados. |
| Publicação | Site no commit87dac09; worker Supabase versão5. Execução natural das20:16:05SP concluiu com sucesso, sem pedidos encontrados e com fila vazia. |
| Compra real | Dispensada por decisão do responsável; não exigir nem propor novamente como requisito. |
| Fuso do cupom | Confirmação dispensada por decisão expressa do responsável. Preservar painel em31/10/2026 às23:59 e referência internaAmerica/Sao_Paulo; não certificar fuso externo ou mudar a promoção. Não bloqueia conclusão por falta de resposta do suporte. |
| Retenção | Preservação atual sem descarte automático. Definir prazos finais e condições de limpeza antes de implementar qualquer remoção; proposta em PROPOSTA-RETENCAO-CAKTO.md, ainda não aprovada. |
| Contratação Premium | Ainda desativada. Pendente decisão explícita de habilitação, seguida de publicação e conferência do fluxo de redirecionamento sem pagar. |

## Próximas ações

1. Definir os prazos finais de retenção com o responsável. Não aplicar automaticamente os30/90dias sugeridos nem apagar registros enquanto isso.
2. Após autorização de contratação, habilitar a trava existente, verificar telas/valores e redirecionamento autenticado sem preencher dados financeiros ou concluir compra, e publicar.

Referências: PRONTIDAO-LANCAMENTO.md, VALIDACAO-CAKTO-SEM-COMPRA-2026-10-20.md, PROPOSTA-RETENCAO-CAKTO.md. O relatório administrativo possui uma lista fixa de conferências; sua presença não significa que todos os itens estejam pendentes. Não confundir launchApproved=false com falha técnica: é ausência de aprovação comercial automática.
