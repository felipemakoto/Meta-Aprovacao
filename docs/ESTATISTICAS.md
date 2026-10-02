# Etapa 22 — estatísticas

Implementada em 02/10/2026 após aprovação do mockup estatisticas-mobile-v2.png: “está bom pode continuar”. Cabeçalho somente com ETEC / IF, conforme remoção solicitada. Página privada /estatisticas, acessível pelo dashboard. Prévia ilustrativa /estatisticas/preview somente em desenvolvimento.

## Indicadores e períodos

Conta respostas concluídas de diagnósticos associados à conta, questões praticadas e simulados finalizados. Cada resposta de uma tentativa conta uma vez. Uma nova tentativa da mesma questão conta novamente; abrir o resultado ou repetir a mesma finalização não cria outra resposta. Tentativas anônimas sem associação, práticas sem correção e simulados incompletos ficam fora.

Todo o período agrega as conclusões da conta até o instante da consulta. Últimos 30 dias é janela móvel de 30 dias calculada no relógio do banco, incluindo exatamente o limite inicial e excluindo datas futuras. Usa data de conclusão, não data de associação ou criação; salvar hoje um diagnóstico antigo não faz sua conclusão entrar na janela recente. Datas apresentadas em America/Sao_Paulo, com ano para evitar ambiguidade.

Resumo apresenta acertos/respostas, erros e quantidade de simulados concluídos. Por matéria usa os mesmos snapshots de correção; fração sempre visível, porcentagem arredondada somente quando há pelo menos cinco respostas naquela matéria no período. Não classifica domínio, força/fraqueza ou probabilidade de aprovação.

Simulados recentes mostra no máximo cinco conclusões do período, em ordem decrescente de conclusão/UUID. Cada item leva ao resultado privado já existente. Quantidades/dificuldades diferentes não são comparadas como evolução. Não há gráfico ou indicador de crescimento inventado.

Dashboard ganhou Estatísticas e usa os mesmos agregados consolidados para Respostas registradas, Acertos e Simulados concluídos. Último teste continua sendo o diagnóstico salvo; não recebe o rótulo de simulado. Falha na consulta consolidada aparece como Indisponível, sem substituir por zero ou pelo subtotal antigo dos diagnósticos.

## Segurança e implementação

Migration 20261002120000 cria read_study_statistics(uuid,text), restrita ao servidor com EXECUTE apenas para service_role. Verifica conta com e-mail confirmado, aplica propriedade em todas as fontes e aceita somente all/30d. Sem novo acesso direto às tabelas, alterações em migrations anteriores ou publicação de conteúdo.

API GET /api/statistics deriva identidade de auth.getUser no servidor. Query permite apenas period; duplicações, campos forjados e períodos inválidos são recusados. Resposta privada/no-store contém somente totais, contagens por matéria e metadados dos cinco resultados recentes. Não exporta snapshots, alternativas, gabaritos ou explicações. Contrato valida somas, contagens, IDs, período e datas, descartando campos extras. Erro operacional não vira conta vazia.

Cliente recebe os agregados iniciais do servidor e consulta API ao mudar período. Cancela requisição anterior, evita resposta atrasada de um período aparecer em outro, limita espera a 15 segundos e permite repetir a consulta. Enquanto carrega, não exibe valores do período anterior. Conta vazia, período vazio, erro, carregamento e amostra insuficiente têm estados próprios.

## Teste no PC

Servidor de desenvolvimento iniciado neste trabalho em 127.0.0.1:3000. Abra http://localhost:3000/estatisticas/preview para testar exemplos sem precisar de questões publicadas.

1. Confira que o cabeçalho não tem Meus estudos e que o resumo mostra 42 de 60 acertos, 18 erros e dois simulados.
2. Escolha Últimos 30 dias. Resumo ilustrativo muda para 27 de 40; matérias com duas respostas mostram a fração sem porcentagem.
3. Volte a Todo o período. Clique no simulado Matemática ou rápido, revise erros/respostas e use Voltar às estatísticas.
4. Confira Ver histórico alinhado à esquerda, com seta antes do texto.
5. Abra /dashboard/preview e Estatísticas; confira a nova navegação e atividade consolidada ilustrativa.

Na aplicação real, faça login e abra /estatisticas. Sem atividade concluída e vinculada, estado vazio é esperado. Não usa exemplos como fallback. Conteúdo real continua em rascunho; teste de persistência real pelo usuário depende de revisão/publicação editorial.

## Demonstrações portáteis

out/estatisticas-demonstracao.html e out/site-demonstracao.html incluem React, fontes, CSS e ícones em um único arquivo. A demonstração combinada começa em Estatísticas e permite alternar oito telas. Dados fixos e correção de fixture local; não lê nem grava contas. Links externos à prévia individual ficam desabilitados. Arquivos ignorados pelo Git, reproduzíveis pelas ferramentas externas já preparadas.

```powershell
Set-Location 'C:/Users/felip/OneDrive/Documentos/projeto_etec-if'
node scripts/build-mobile-preview.mjs 'C:/Users/felip/.codex/previews/etec-if-stage19' estatisticas
Copy-Item -LiteralPath 'C:/Users/felip/.codex/previews/etec-if-stage19/estatisticas-demonstracao.html' -Destination 'out/estatisticas-demonstracao.html'
```

## Verificação e limites

- Seis testes novos de contrato/handler, 15 regressões de dashboard/histórico/simulados: 21 aprovados.
- Três testes novos HTTP/HTML e três regressões HTTP de dashboard: seis aprovados em desenvolvimento. Sessão ausente/forjada recusada, página redireciona ao login, POST 405, cabeçalho da prévia sem retorno, valores/controles presentes e arquivos portáteis com ativos incorporados e JS válido. Primeira execução encontrou servidor desligado; após iniciá-lo, todos passaram.
- Testes HTTP antigos do dashboard tinham textos da versão anterior. Ajustados ao visual clean já aprovado, mantendo verificações de autenticação, cache, estados e acesso à revisão.
- SQL no Supabase aprovado: soma das três fontes, diagnósticos não associados excluídos, repetição de prática contada como nova resposta, associação tardia de diagnóstico, limite exato de 30 dias e um microssegundo antes, exclusão de incompletas/futuras, preservação após edição ao vivo, isolamento entre contas, usuário não confirmado, período inválido, limite de cinco recentes e privilégios. Fixtures revertidas por rollback; nenhuma questão publicada.
- Migration aplicada após histórico e dry-run; dez migrations locais/remotas sincronizadas. Lint, TypeScript e build aprovados. Dependências preservadas.
- Captura/comparação visual, interação por teclado, console e larguras renderizadas continuam pendentes por bloqueio de navegador registrado anteriormente. Abrir a aba não comprova inspeção da tela. HTTP de produção continua pendente; build não substitui esses testes. Registro em ../design-qa.md.

Para repetir:

```powershell
npm.cmd run test:statistics
npm.cmd run test:statistics:http
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_statistics.sql
git log -3 --oneline
git status
```

Pausa para teste manual do usuário. Etapa 23 não iniciada.
