# Checagem de lançamento — etapa 36

Implementada em 10/10/2026. Reúne a situação real de conteúdo, catálogo, operação e configuração local, sem liberar vendas. A checagem é administrativa, somente de leitura, com contagens e estados; não exibe enunciados, gabaritos, dados do comprador, referências, IDs comerciais ou credenciais.

## Resultado desta conferência

| Item | Situação |
| --- | --- |
| Automação e monitoramento | Funcionando; fila vazia e última execução concluída |
| Configuração local do checkout | URLs/IDs dos períodos promocional e regular válidos no verificador local |
| Questões | 10 rascunhos, 0 revisadas, 0 publicadas; duas por matéria |
| Diagnóstico e prática | Sem conteúdo publicado disponível |
| Simulado rápido gratuito | Modelo em rascunho, sem conteúdo publicado suficiente |
| Catálogo Premium e matéria | Modelo de Matemática em rascunho, sem conteúdo publicado suficiente |
| Cobranças/acesso comercial | Nenhuma prova ou período pago comercial registrado |
| Contratação | Desativada |

Há dois modelos de simulado no banco: rápido com dez questões e Matemática com vinte. Publicar somente as dez questões atuais, depois de revisão, poderia suprir o diagnóstico e o rápido; não supriria o modelo de Matemática, que exige vinte questões publicadas dessa matéria. Os modelos também exigem publicação explícita. Esta observação de quantidade não é aprovação editorial.

O inventário retornou zero sinais, jobs, provas de pagamento/ciclo/renovação, períodos e intenções expiradas. O histórico técnico dos dois agendamentos tinha 1.650 execuções no instante da consulta e continua crescendo. Nenhum desses registros foi removido. A contagem de provas não distingue, por si só, uma fixture de teste de uma compra comercial e nunca aprova o lançamento.

## Como repetir

Na pasta atual, usando o `.env.local` já configurado:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\cakto\projeto_etec-if'
npm.cmd run cakto:launch-check
```

O texto mostra `OK` ou `PENDENTE` para cada verificação automática. Para contagens por matéria, catálogo, incidentes e inventário de retenção:

```powershell
npm.cmd run cakto:launch-check -- --json
```

O script direto termina com código 2 porque a aprovação comercial continua pendente, inclusive quando as verificações técnicas passam. O npm pode repassar essa condição como código 1; a presença do relatório completo indica uma consulta concluída com pendências. `Checagem indisponível` significa erro de configuração/consulta, nunca aprovação nem zero inventado.

Essa configuração é a do computador onde o comando roda. Ela não comprova os valores salvos na Vercel, o preço real da oferta, o funcionamento do cupom, a disponibilidade contínua do provedor ou a configuração HTTPS/Supabase Auth de produção. Essas conferências continuam separadas.

## Critérios automáticos

- Diagnóstico: ao menos duas questões **publicadas e com gabarito** em cada uma das cinco matérias.
- Prática: existe pelo menos uma questão publicada e com gabarito. Isso mede disponibilidade técnica, não tamanho/qualidade suficientes para vender ilimitadas.
- Rápido gratuito: há um modelo publicado, gratuito, misto, de dez questões e com cobertura suficiente por matéria.
- Premium: existe modelo publicado não gratuito, com a quantidade de questões publicada exigida; matéria exige também pelo menos um modelo específico de matéria utilizável. As contagens mostram a cobertura existente, sem afirmar que todas as matérias estão disponíveis.
- Operação: processador habilitado, última execução concluída com sucesso, sem condição ativa de atenção, monitor ativo e com amostra recente.
- Configuração local: verificador existente aceita as URLs/IDs promocionais e regulares. Isso não é consulta da oferta na API.

`draft` e `reviewed` não contam como conteúdo disponível. Modelo publicado sem questões suficientes também não conta. Falhas de RPC, datas ou somas inconsistentes são rejeitadas. Mesmo com todos os critérios técnicos verdes, `launchApproved` permanece `false`: este comando não certifica revisão humana ou uma venda.

## Pendências que exigem evidência separada

1. Revisar as [dez questões existentes](REVISAO-SEED.md), registrar correções/aprovação humana e ampliar o lote para o conteúdo prometido. A aprovação do mockup, dos testes ou um “continue” não publica conteúdo gerado por IA.
2. Confirmar o contrato real de moeda BRL, unidade/valores e formato dos campos do pedido/assinatura na Cakto. O verificador mantém divergências ou moeda ausente em revisão.
3. Validar pagamento e entrega comerciais de ponta a ponta, com ambiente oficial autorizado ou compra explicitamente autorizada. As simulações locais já aprovadas não comprovam esse contrato externo. Não foi realizada compra nesta etapa.
4. Confirmar horário/fuso de expiração do cupom em 31/10/2026 e desconto somente na primeira mensalidade, além dos valores e taxa no checkout real.
5. Definir retenção e manutenção de dados financeiros/histórico técnico, preservando vínculos, provas de pagamento, deduplicação e direitos pagos. Não existe limpeza financeira automática nesta etapa.
6. Conferir produção e disponibilidade externa, incluindo Vercel, Supabase Auth e acompanhamento do serviço. O monitor atual não envia alertas para fora do banco.

## Implementação e verificação

Migration `20261010200000_cakto_launch_readiness.sql` cria somente uma RPC agregada, sem parâmetros, exclusiva de `service_role`. Função com `SECURITY DEFINER`, `search_path` vazio e execução revogada para clientes. Não amplia acesso direto às tabelas; consulta existente de saúde preservada.

`checkoutEnabled` foi centralizado em `checkout-launch.ts` e reutilizado pela rota real e pelo relatório. O valor continua `false`, sem alteração no comportamento da página ou da API. Mudar configurações de ambiente, parâmetros do navegador ou a saída da checagem não habilita a contratação. O relatório mostra a trava da versão local do código, não presume que a Vercel já publicou essa versão.

Migration ensaiada com rollback/testes, conferida com dry-run e aplicada; testes SQL repetidos depois. Fixtures transitórias verificaram rascunho, falta de gabarito, diagnóstico, rápido, Matemática com vinte questões, estado revisado, projeção sem conteúdo, privilégios e preservação do inventário comercial. Todas revertidas; questões reais continuam em rascunho.

Nove testes Node de prontidão/checkout e dois HTTP passaram. Integração real confirmou leitura administrativa, projeção válida, contratação bloqueada e acesso anônimo negado. Lint e build/TypeScript aprovados. Os testes HTTP exigiram iniciar o servidor local, que estava parado; passaram depois disso. O relatório real em texto/JSON mostrou as pendências acima. Nenhuma cobrança, publicação editorial, concessão ou exclusão de dados foi executada.

Guias relacionados: [MONITORAMENTO-CAKTO.md](MONITORAMENTO-CAKTO.md), [AUTOMACAO-CAKTO.md](AUTOMACAO-CAKTO.md), [BENEFICIOS-PREMIUM.md](BENEFICIOS-PREMIUM.md) e [VERIFICACAO-CAKTO.md](VERIFICACAO-CAKTO.md).
