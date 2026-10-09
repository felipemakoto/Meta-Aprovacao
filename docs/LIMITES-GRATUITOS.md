# Etapa 23 — limites gratuitos

Atualização de 09/10/2026 — [etapa 33](BENEFICIOS-PREMIUM.md): os limites abaixo valem para contas sem período Premium atual. Premium válido usa cotas nulas e catálogo completo publicado; expiração devolve o gratuito sem apagar tentativas/revisões. O restante registra a implementação original.

Em 02/10/2026, o usuário autorizou avançar após a prévia de Estatísticas e confirmou os limites: **10 novas questões de prática e 1 novo simulado rápido de 10 questões por dia**, renovados à meia-noite de America/Sao_Paulo. Diagnóstico gratuito e revisão de resultados continuam disponíveis. Etapa 24 não iniciada.

## O que consome uma vaga

Uma tentativa de prática criada com sucesso consome uma questão, mesmo que seja abandonada, repetida ou de outro filtro. Buscar sem conteúdo não consome. Conferir uma resposta ou repetir a correção não consome outra vaga. A interface envia um UUID por busca: repetir a mesma busca após falha de conexão recupera a tentativa original, dentro do prazo de 30 minutos. Mudar os filtros inicia uma nova busca; não recupera uma busca anterior cuja resposta se perdeu.

Um novo simulado iniciado consome uma vaga. Suas dez questões não descontam da prática. Retomar a tentativa aberta da mesma opção não consome outra vaga; terminar e começar novamente consome. Tentativas já iniciadas, inclusive as anteriores de 20 questões, continuam acessíveis pelo seu endereço dentro do prazo original. Resultados e histórico concluídos permanecem disponíveis. Tentativas iniciadas hoje antes da migration contam no saldo de hoje; não houve apagamento ou zeragem de registros.

O dia usa o relógio do banco e São Paulo, independentemente do fuso ou relógio do dispositivo. A renovação é calculada por intervalo de datas, sem tarefa agendada. Não é uma janela móvel de 24 horas. Somente o simulado rápido de dez questões equilibradas entre cinco matérias está marcado para novas tentativas gratuitas. Modelos e questões reais permanecem em rascunho; não foram publicados nesta etapa.

## Proteção e interface

Migration 20261002160000 adiciona free_access ao catálogo privado, mapa privado de repetição de busca e wrappers dos RPCs existentes. A checagem e a criação são serializadas por usuário no mesmo lock transacional. O consumo é derivado das tentativas, sem um segundo contador que possa divergir. Implementadores antigos foram movidos para private e tiveram EXECUTE revogado, inclusive para service_role; a API somente chama os wrappers restritos. Dados privados seguem com RLS e sem leitura/escrita direta pelos papéis da API.

Todas as contas atuais usam a política gratuita. Não há liberação Premium por campo, parâmetro ou armazenamento do navegador. Assinaturas serão modeladas na etapa 25, depois da documentação Kiwify da etapa 24. Os limites técnicos anteriores de solicitações continuam nos implementadores; o limite diário comercial tem precedência quando esgotado.

GET /api/limits usa a conta confirmada/verificada no servidor, devolve apenas saldo e horário de renovação e não aceita parâmetros. Resposta privada, sem cache; falha não vira saldo zero ou ilimitado. Prática e Simulados exibem uma linha com saldo e renovação; 403 daily_practice_limit/daily_simulation_limit recebem mensagem específica. 429 técnico e 503 de indisponibilidade continuam distintos. O botão de início fica disponível para permitir retomar uma tentativa existente. Conferir resposta e revisar histórico não são bloqueados pelo saldo.

Permissões conferidas conforme a [documentação oficial de funções Supabase](https://supabase.com/docs/guides/database/functions), com search_path vazio e revogação explícita. Não houve nova dependência, variável de ambiente ou publicação do site.

## Testar no PC

Abra http://localhost:3000/questoes/preview e http://localhost:3000/simulados/preview. São demonstrações: o saldo é ilustrativo, não gasta vagas e não grava na conta.

1. Na prática, confira o saldo, selecione uma alternativa e confira a explicação.
2. Abra http://localhost:3000/questoes/preview?limit=1. Buscar/Próxima questão informa o limite; conferir a questão exibida continua disponível.
3. Abra http://localhost:3000/simulados/preview?limit=1. O saldo é zero; clicar em Iniciar simulado mostra o aviso e horário de renovação.
4. Na prévia normal de Simulados, somente Simulado rápido é oferecido. A revisão ao finalizar permanece igual.
5. Na aplicação real, faça login e abra /questoes e /simulados. Sem conteúdo revisado/publicado, falta de questões e catálogo em preparação são esperados, sem consumo. GET /api/limits retorna o saldo da conta. O teste positivo completo na interface real depende da revisão editorial.

Servidor de desenvolvimento local mantido em 127.0.0.1:3000. Caso esteja desligado:

```powershell
Set-Location 'C:/Users/felip/OneDrive/Documentos/projeto_etec-if'
npm.cmd run dev -- --hostname 127.0.0.1
```

Prévias exclusivas de desenvolvimento; não são páginas públicas de produção. Demonstrações portáteis out/questoes-demonstracao.html, out/simulados-demonstracao.html e out/site-demonstracao.html regeneradas, ignoradas pelo Git.

## Verificação realizada

- 22 testes Node de limites, prática, simulados e estatísticas passaram.
- Oito testes HTTP/HTML em desenvolvimento e arquivos portáteis passaram: sessão ausente/forjada, cache, CSRF, método inválido, rotas protegidas, saldo/esgotamento e catálogo gratuito. Uma asserção inicial não considerava comentários de texto do React; foi corrigida para verificar texto HTML sem scripts/tags.
- SQL de limites: saldo exato, busca vazia, reenvio com UUID, parâmetros diferentes recusados, dez questões, troca de filtros sem liberação, resposta/revisão no limite, isolamento, conta não confirmada, acesso gratuito ao catálogo, ID não gratuito recusado, retomada, novo modelo bloqueado, finalização/reenvio/histórico, dia anterior e meia-noite inclusiva, privilégios. Todas as fixtures revertidas por rollback.
- Regressões SQL de prática, simulados e estatísticas passaram. O teste anterior de simulados representa agora a tentativa de 20 questões pré-existente usando o implementador privado apenas como postgres na preparação da fixture. API de usuário não recebeu esse acesso.
- Concorrência real por duas conexões: com nove práticas prévias, somente uma chamada ganha a última vaga; dois modelos rápidos disputam a única vaga de simulado; duas retomadas retornam a mesma tentativa. Fixtures novas permanecem draft nos estados confirmados: publicação transitória acontece apenas dentro da transação do teste e é restaurada antes de commit. Usuário, tentativas, modelos, questões e função temporária removidos no finally. Nenhum conteúdo editorial publicado. SQL temporário é preservado se a limpeza falhar; não interromper o processo desse teste.
- Migration testada em transação com rollback antes de aplicar, dry-run aprovado, aplicada e onze migrations locais/remotas sincronizadas. Lint, TypeScript e build passaram.
- QA visual, console, teclado e larguras renderizadas seguem pendentes pelo bloqueio de navegador registrado anteriormente. HTTP de produção permanece pendente. Testes de HTML/build não substituem essas verificações. Aba solicitada no Codex retornou queued; não comprova inspeção visual.

Para repetir com o servidor em outro terminal:

```powershell
npm.cmd run test:limits
npm.cmd run test:limits:http
npm.cmd run test:limits:concurrency
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_free_limits.sql
git log -3 --oneline
git status
```

Checkpoint local: consultar git log -1 --oneline. Pausa para teste do usuário antes da etapa 24.
