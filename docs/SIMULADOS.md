# Etapa 21 — simulados

Implementada em 30/09/2026 após aprovação de design/simulados-mobile-v1.png: “pode usar esse visual e seguir”. Catálogo em /simulados, acesso pelo dashboard, tentativa em /simulados/[id] e categoria Simulados no histórico. Prévia ilustrativa em /simulados/preview somente em desenvolvimento.

## Comportamento

- Escolher um simulado, responder uma questão por vez, voltar às anteriores e conferir todas as escolhas antes do envio definitivo.
- Correção somente ao finalizar, com acertos, erros, duração medida no servidor e revisão das explicações uma por vez. Por matéria disponível quando há pelo menos cinco questões daquela matéria; a porcentagem descreve apenas esse simulado, não previsão de aprovação.
- Resultado salvo automaticamente na conta confirmada. Histórico lista somente simulados concluídos, com paginação por data e UUID. Retorno ao histórico continua à esquerda, com seta antes do texto.
- Dashboard oferece Simulados e conta os concluídos separadamente. Os totais anteriores de questões/acertos continuam referentes aos testes diagnósticos salvos; estatísticas consolidadas pertencem à etapa 22.
- Iniciar novamente a mesma opção retoma a tentativa ativa da conta. Prazo técnico de 24 horas, definido pelo servidor, sem contagem regressiva ou tempo oficial de prova. Tentativa expirada e incompleta não pode finalizar; resultado concluído permanece acessível.
- Antes de enviar, escolhas ficam em sessionStorage nesta aba, quando o navegador permite. Recarregar restaura esse rascunho; outro dispositivo ou fechar a aba não o preserva. Se o envio falhar, repetir mantém as mesmas respostas para recuperar o resultado com segurança.

## Conteúdo e proteção

Migration 20260930190000 cria catálogo e tentativas em private, com RLS e sem SELECT direto para anon/authenticated/service_role. RPCs restritas ao servidor verificam conta com e-mail confirmado e propriedade. Catálogo exige publicação editorial do simulado e quantidade suficiente de questões publicadas com gabarito. Amostra geral é equilibrada entre cinco matérias; amostra de matéria usa somente essa matéria. Snapshot preserva versões, enunciado, alternativas e correção; leitura da tentativa remove gabarito e explicação.

Finalização bloqueia a linha, valida todos os IDs/alternativas e grava respostas normalizadas, resultado e conclusão juntos. Reenvio equivalente devolve o resultado original; envio diferente após concluir retorna conflito. API deriva identidade da sessão verificada e não aceita usuário, pontuação ou duração do cliente. POST valida origem, tamanho, timeout de leitura e formato; respostas privadas/no-store, erros genéricos.

Simulado rápido (10 questões) e Matemática (20) foram criados em rascunho. Nenhuma questão real publicada nesta etapa. Portanto, catálogo real vazio é o comportamento esperado até a revisão editorial. Não há fallback com dados da demonstração.

## Testar pelo celular

Abra out/simulados-demonstracao.html com JavaScript habilitado, como nas demonstrações anteriores. Arquivo único com React, fontes, CSS e ícones incorporados; não precisa acessar localhost.

1. Escolha Simulado rápido ou Matemática e clique Iniciar simulado.
2. Responda e volte a uma questão anterior para alterar a escolha.
3. No fim, use Conferir respostas; clique em uma questão para editá-la.
4. Use Enviar e ver resultado. Revise erros e todas as respostas, voltando ao resumo.

Questão de porcentagem repetida para exercitar o fluxo; correta B (R$ 68,00). A demonstração calcula a nota das escolhas localmente; duração de quatro minutos é ilustrativa. Não salva na conta nem comprova persistência real.

out/site-demonstracao.html também atualizado, começando em Simulados. Permite alternar as sete telas de estudo e acessar o histórico ilustrativo. Esse histórico usa um resultado fixo de exemplo, não registra as tentativas respondidas no arquivo. out/historico-demonstracao.html regenerado com a categoria nova. Links de conta continuam disponíveis somente na aplicação completa.

## Verificações

- Cinco testes Node de contratos/API e 32 regressões de quiz/correção/resultado/dashboard/histórico aprovados.
- Três testes HTTP/arquivo novos e quatro regressões HTTP/arquivo de histórico em desenvolvimento aprovados: autenticação obrigatória, origem externa recusada, páginas protegidas, prévia e HTML portátil com JS válido/ativos incorporados.
- SQL no Supabase aprovado: quantidade e equilíbrio, isolamento entre contas, usuário não confirmado, envio inválido/incompleto, snapshot após edição, repetição/conflito, expiração, catálogo em rascunho ou insuficiente, histórico paginado 20+3 com timestamp empatado, resumo e privilégios. Fixtures revertidas por rollback. Teste SQL da etapa 20 também aprovado.
- Teste real com duas RPCs simultâneas aprovado: dois envios equivalentes devolvem o mesmo resultado; dois diferentes produzem um sucesso e um conflito. Usuário sem e-mail e tentativas privadas de teste removidos no finally, confirmado ao encerrar. Nenhuma questão publicada por esse teste.
- Migration aplicada depois de conferir histórico e dry-run; nove migrations locais/remotas sincronizadas. Lint, TypeScript e build de produção aprovados. Dependências preservadas.
- QA visual permanece bloqueado pela política de navegador registrada nas etapas anteriores. Não houve captura/comparação, inspeção de console ou teclado nesta etapa. Verificação HTTP de produção permanece pendente; build não substitui essas verificações. Registro em ../design-qa.md.

## Repetir verificações no PowerShell

```powershell
Set-Location 'C:/Users/felip/OneDrive/Documentos/projeto_etec-if'
npm.cmd run test:simulations
npm.cmd run test:simulations:http
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_simulations.sql
npm.cmd run test:simulations:concurrency
git log -3 --oneline
git status
```

HTTP exige a aplicação em desenvolvimento. Concorrência exige CLI autenticada e .env.local do servidor; não copiar chaves para o navegador ou mensagens.

Para regenerar demonstrações com as ferramentas externas existentes:

```powershell
node scripts/build-mobile-preview.mjs 'C:/Users/felip/.codex/previews/etec-if-stage19' simulados
Copy-Item -LiteralPath 'C:/Users/felip/.codex/previews/etec-if-stage19/simulados-demonstracao.html' -Destination 'out/simulados-demonstracao.html'
```

## Encerramento

Pausa para conferência manual do usuário. Testar no celular sem transbordamento, botões/seleção, alteração antes de enviar, nota e revisão. Teste de persistência real pelo usuário depende de conteúdo revisado e publicado. Não iniciar etapa 22 antes desta conferência.
