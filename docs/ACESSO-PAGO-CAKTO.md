# Acesso pago Cakto — etapa 32

Atualização de 09/10/2026 — etapa 33: [benefícios Premium](BENEFICIOS-PREMIUM.md) conectados aos períodos atuais; a pendência de cotas/benefícios mencionada abaixo foi resolvida tecnicamente. Contratação e validação comercial externa continuam pendentes. O restante registra a etapa 32.

Implementação em 09/10/2026, após o usuário autorizar continuar com duração calculada pela plataforma. Projeto localizado no caminho atual `C:\Users\felip\OneDrive\Documentos\cakto\projeto_etec-if`; checkout e telas preservados.

## Regra do produto

Cada mensalidade confirmada pela consulta independente adquire **30 dias completos (720 horas)**. A primeira começa em `paidAt`. Uma renovação começa no maior valor entre o fim do período anterior e a data do novo pagamento; se o período anterior foi revogado, começa na data do novo pagamento. Exemplo: pagamento em 10/10 às 12h dá acesso até 09/11 às 12h; renovação antecipada acrescenta mais trinta dias ao fim já adquirido. Pagamento após expiração começa um novo período na data paga.

Essa é uma regra de acesso do Meta Aprovação. Não se confunde com a data estimada `next_payment_date`, nem altera calendário, preço ou cobrança na Cakto. O vencimento deixa de exigir uma data final fornecida pelo provedor. Uma compra não é necessária para desenvolver/testar essa regra.

O pagamento continua exigindo identidade, conta/intenção vinculadas, status pago, valores exatos e moeda confirmada. Não se usa o corpo do webhook como prova. Moeda ausente/divergência continuam em revisão; o contrato externo ainda precisa de confirmação antes de liberar contratação. Testes simulados não comprovam o formato de produção.

## Concessão, renovação e reversão

Migration `20261009180000_cakto_paid_access.sql`: registro individual de períodos (`cakto_access_periods`) e evidência de renovação (`cakto_renewal_payments`), privados, com RLS e sem acesso direto. Pedido e número da mensalidade são únicos; repetir ou processar concorrentemente não aumenta duração duas vezes. As validações anteriores permanecem em funções privadas sem execução por clientes/service_role; wrappers públicos executáveis apenas por service_role fazem persistência e concessão na mesma transação.

A primeira evidência validada cria a assinatura e seu período. A renovação exige primeira evidência, vínculo à mesma assinatura/produto/oferta, cobrança inteira sem cupom inicial, BRL, datas válidas, recorrência de trinta dias e sequência de períodos. Evento fora de sequência fica em revisão; não se inventam mensalidades ausentes. Duplicata conhecida pode ser conferida de novo sem novo período. Falha/conflicto na gravação desfaz observação, evidência e concessão.

Cancelamento/pausa/atraso preservam períodos pagos. Reembolso/chargeback confirmado marca somente o período daquela cobrança. A leitura verifica intervalos individuais, incluindo lacunas: reembolso da primeira mensalidade com renovação antecipada já paga não dá acesso antes do início dessa renovação. Reembolso da renovação antecipada conserva a primeira mensalidade ainda vigente. Snapshot ativo ou pagamento repetido não limpa a revogação.

A leitura calcula o maior fim de cobertura contínua a partir do momento atual; períodos futuros ou expirados não liberam acesso agora. A expiração usa o relógio do banco, sem depender de cron. Assinaturas gerenciadas pela política nova exigem registros individuais; apagar a evidência não permite voltar ao intervalo agregado sem prova. Registros legados conservam o contrato anterior e não são convertidos/ativados retroativamente.

O consumidor manual `cakto:reconcile` agora descobre também renovações pagas recentes sem webhook, vinculando-as pela primeira prova; continua limitado à janela/paginação da etapa 30. Eventos `subscription_renewed` seguem o caminho da renovação. Renovação entregue apenas como `purchase_approved` ainda cai em revisão no verificador inicial; a descoberta posterior pode recuperá-la como renovação. Não alegar cobertura completa de todos os formatos históricos.

## Verificações e limites

Quatro testes do ciclo, três de reconciliação e sete de pagamentos aprovados; lint e build/TypeScript aprovados. Ensaio de migration com rollback, dry-run e aplicação realizados. SQL de acesso cobre primeira concessão/deduplicação, renovação tardia, expiração, sequência/vínculo, cancelamento, reversão/replay, falta de evidência e privilégios. Regressão da evidência atualizada para a concessão transacional.

Integração com banco/RPCs reais e provedor simulado: primeira concessão de trinta dias, renovação antecipada concorrente totalizando sessenta dias sem duplicação, cancelamento preservado, lacuna correta após reembolso e ausência de restauração por replay. Conta e dados de teste removidos. Nenhuma chamada de cobrança/alteração comercial na Cakto.

Regressões SQL de pagamentos, acesso, ciclo e reconciliação aprovadas após a aplicação. Auditoria final: inbox, provas de pagamento/ciclo, fila, assinaturas, períodos e provas de renovação em zero. Consulta real da reconciliação concluída com zero pedidos, itens e falhas; não comprova um pagamento externo positivo. Último ajuste de limite de sequência conferido com sete testes de ciclo/reconciliação e lint direcionado.

Contratação permanece `enabled:false`. Não foram ativados benefícios/cotas Premium nem agendamento automático. Pendências externas de moeda/formato de pedido, ambiente de teste oficial e validação comercial permanecem; a duração do acesso foi resolvida pela regra local. Próximo trabalho: benefícios Premium e processamento agendado, com teste externo antes do lançamento.

Fontes e histórico da API em [VERIFICACAO-CAKTO.md](VERIFICACAO-CAKTO.md), [CICLO-CAKTO.md](CICLO-CAKTO.md) e [RECONCILIACAO-CAKTO.md](RECONCILIACAO-CAKTO.md). A regra de trinta dias é decisão do produto, não um campo alegadamente fornecido pela API.
