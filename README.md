# Preparação ETEC / IF

Plataforma de preparação para o Vestibulinho da ETEC e processos seletivos de Institutos Federais, em construção.

Etapa 13 implementada e verificada: entrada, quiz, correção no servidor, resumo e revisão das respostas. As questões reais permanecem em rascunho para revisão editorial; prévias locais permitem testar as interfaces. Contas, simulados e Premium ficam para etapas posteriores.

## Por onde começar

1. Leia as instruções de execução abaixo para abrir o projeto no computador.
2. Consulte [Estado do Projeto](docs/ESTADO-DO-PROJETO.md) para saber o que foi verificado, as pendências e a próxima etapa.
3. Consulte [Decisões técnicas](docs/DECISIONS.md) para entender as escolhas e suas razões.

O site roda localmente; não há site publicado. Etapa 5 concluída: projeto Supabase `estudos-etec/if` criado no plano Free, em São Paulo, com status Healthy. Dados e verificação em [Supabase — etapa 5](docs/SUPABASE.md). Etapa 6 implementada: clientes Supabase e verificação de sessão no servidor. Consulte [Autenticação base](docs/AUTH-BASE.md) para configurar e testar. Cadastro e login visual permanecem nas etapas 14–16.

## Tecnologias
Node.js 24 LTS (24.20.0 verificado), npm 11.19.0, Next.js 16.3.6, React 19.2.8, TypeScript 5, Tailwind CSS 4 e ESLint 9. App Router em src/app. Versões exatas no package-lock.json; preserve esse arquivo e use somente npm.

## Instalação no Windows 11
Node, npm e Git já estão instalados neste computador. Não precisa reinstalar.
Em outro computador, abra https://nodejs.org/en/download, escolha Node 24 LTS, Windows e o instalador .msi da arquitetura do computador. Abra o arquivo, clique em Next, aceite a licença, mantenha as opções padrão, clique em Install e Finish. Ferramentas nativas adicionais não são necessárias nesta etapa. Reabra o PowerShell.

No menu Iniciar, procure PowerShell e abra. Verifique:
```powershell
node --version
npm.cmd --version
git --version
```
O Node deve mostrar v24.x.x. npm.cmd é o próprio npm no Windows; evita bloqueio do npm.ps1 sem alterar a política de segurança do PowerShell.

## Execução
No PowerShell:
```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1
```
npm ci instala as versões registradas; não é necessário repetir em cada execução. Quando aparecer Ready, abra http://localhost:3000 no navegador. Mantenha o terminal aberto; Ctrl+C para parar. Se o servidor já estiver ativo, utilize-o.

## Comandos importantes
```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd start -- --hostname 127.0.0.1
git status
```
Lint verifica o código. Build compila para produção. Start executa o build criado. Pare o servidor de desenvolvimento antes de executar build.
Git status mostra alterações. Git add . prepara arquivos não ignorados para salvar; git commit -m "mensagem" salva um checkpoint local. Revise o status antes. GitHub será abordado depois.

## Git: salvar versões do projeto (etapa 2)

Git registra versões dos arquivos. Cada commit é um checkpoint que permite consultar o conteúdo salvo e recuperar mudanças posteriormente. Os commits deste projeto estão apenas neste computador; isso ainda não é um backup externo. A branch (linha de histórico) atual é `master`. A identidade Git existente foi preservada.

### Consultar o estado e o histórico

Abra o menu Iniciar, digite PowerShell e abra o programa. Se o servidor estiver ocupando um terminal, abra uma segunda janela. Copie e execute:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
git status
git --no-pager log -3 --oneline
```

Depois de cada checkpoint, o status deve mostrar `On branch master` e `nothing to commit, working tree clean`. Isso significa que não há alterações pendentes nos arquivos acompanhados pelo Git nem arquivos novos não ignorados. O histórico mostra o checkpoint mais recente primeiro; o código antes da mensagem identifica o commit. O exercício da etapa 2 gerou `268318b`; etapas posteriores aparecem acima dele.

### Exercício real realizado nesta etapa

Atualizamos este README e o Estado do Projeto. Antes de salvar, revisamos as diferenças com:

```powershell
git status --short
git --no-pager diff -- README.md docs/ESTADO-DO-PROJETO.md
```

O status mostra `M` nos arquivos modificados. No diff, linhas com `+` foram acrescentadas e linhas com `-` foram removidas. Depois da revisão, preparamos somente os dois arquivos e conferimos o que entraria no commit:

```powershell
git add README.md docs/ESTADO-DO-PROJETO.md
git --no-pager diff --cached
git commit -m "docs: documentar fluxo Git da etapa 2"
git status
```

`git add` prepara a versão atual dos arquivos; `git diff --cached` mostra as mudanças preparadas; `git commit` grava essas mudanças no histórico. `git add .` prepara todos os arquivos novos e alterados não ignorados dentro da pasta atual, por isso só use depois de revisar o status. Não precisa repetir o commit deste exercício: ele já foi realizado. Com a pasta limpa, repetir o commit informa que não há nada para salvar.

### Confirmar arquivos ignorados

```powershell
git check-ignore .env.local .env.production node_modules/ .next/
git ls-files '.env*'
```

O primeiro comando deve listar os quatro caminhos, mesmo que os arquivos de ambiente ainda não existam. O segundo deve retornar sem mostrar arquivos: nenhum `.env` está versionado. O `.gitignore` não remove arquivos que já tenham sido versionados; não use `git add -f` para incluir credenciais.

### Se aparecer um erro

- `git não é reconhecido`: feche e reabra o PowerShell e execute `git --version`.
- `not a git repository`: execute o `Set-Location` acima; não crie outro repositório.
- `Author identity unknown`: pare e informe a mensagem; a identidade já estava configurada neste computador.
- Aviso `LF will be replaced by CRLF`: é um aviso sobre quebras de linha no Windows; confira o resultado do commit e `git status`.
- Se o status mostrar alterações inesperadas, envie os nomes dos arquivos e a mensagem, sem valores de credenciais. Não descarte alterações para forçar uma pasta limpa.

## Variáveis
A etapa 6 usa NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local na raiz. O arquivo já foi preenchido localmente com a URL e a chave pública do painel; .env* permanece ignorado pelo Git. Não há chave administrativa. Para outra instalação, seguir [AUTH-BASE.md](docs/AUTH-BASE.md).

Uma variável de ambiente é uma configuração fornecida ao programa fora do código. Reinicie o servidor após alterar .env.local e gere novo build ao mudar valores públicos para produção. Nunca use secret key ou service_role em NEXT_PUBLIC_.

## Arquivos
- src/app/page.tsx: página inicial, rota /.
- src/app/layout.tsx: estrutura compartilhada.
- src/app/globals.css: tokens visuais, tema claro e foco.
- src/app/entry.module.css: estilos responsivos da entrada.
- src/app/start-test-button.tsx: link de entrada para /quiz.
- public/icons/: setas oficiais Heroicons e licença MIT.
- design-qa.md: verificação visual e evidências.
- docs/DECISIONS.md: decisões técnicas.
- docs/ESTADO-DO-PROJETO.md: progresso.

## Manutenção da documentação

Ao final de cada etapa, atualize o estado com os resultados realmente verificados. Atualize este README se os comandos, requisitos ou variáveis mudarem. Registre decisões relevantes e suas razões em DECISIONS. Diferencie sempre o que foi implementado do que é apenas planejado.

Para conferir os comandos disponíveis sem executá-los:

```powershell
npm.cmd run
```

Devem aparecer `dev`, `build`, `start`, `lint`, `test:config`, `test:auth`, `test:questions` e `test:seed`. O teste de configuração roda sem servidor. O teste de autenticação exige o site rodando, .env.local preenchido e internet; instruções e resultados em [AUTH-BASE.md](docs/AUTH-BASE.md). O teste de questões usa diretamente o Supabase e não exige o site rodando.

## Teste manual e erros
1. Abra http://localhost:3000. Deve aparecer a entrada ETEC / IF, com título serifado, destaque amarelo e botão verde, sem o card 10 questões.
2. Redimensione a janela: o texto deve se adaptar sem rolagem horizontal.
3. Clique em Começar teste grátis: abre /quiz. Enquanto o lote estiver em draft, aparece “O teste está em preparação.”.
4. Use Tab e Enter para abrir o quiz pelo teclado.
5. Para testar seleção e navegação da etapa 11, abra /quiz/preview em desenvolvimento.
Se não abrir, confira Ready no terminal e a porta indicada. Se um comando não for encontrado, reabra o PowerShell. Caso persista, envie a mensagem do erro sem credenciais.

## Documentação oficial
- https://nodejs.org/en/about/previous-releases
- https://nodejs.org/en/download
- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/api-reference/cli/create-next-app

## Visual implementado na etapa 4

O [design system](docs/DESIGN-SYSTEM.md) e o [mockup v4 aprovado](docs/design/entrada-mobile-v4.png) orientam a entrada atual. [Comparação e testes](design-qa.md) registram a verificação em 320, 390 e 1280px. Lint e build passaram após a implementação.

A página é construída com HTML/React e CSS. DM Serif Display e Geist são servidas por next/font; a obtenção inicial das fontes no build requer internet. Nenhuma dependência npm nova foi adicionada.

Checkpoint da interface: 064e4e9 — feat: implementar entrada aprovada da etapa 4. O pedido para avançar ao Supabase foi aceito como confirmação do teste da interface. A etapa 5 foi concluída com o banco remoto provisionado. Login do aplicativo, quiz e pagamentos ainda não implementados.

## Teste da etapa 6

Com o site rodando, execute em outro PowerShell:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd run test:config
npm.cmd run test:auth
curl.exe -i http://localhost:3000/api/auth/status
```

Esperado: seis testes aprovados no total e HTTP 401 com authenticated false no curl, pois ainda não há usuário logado. O teste de conexão com o Supabase deve passar separadamente; não confundir a rejeição de visitante com falha de integração. A página inicial continua pública. Não há telas de cadastro ou login nesta etapa.

## Etapa 7 — migrations concluídas

A CLI Supabase 2.117.0 foi instalada como dependência de desenvolvimento. A primeira migration, 20260925015139, foi aplicada e verificada no Supabase: schema private restrito e permissões explícitas para futuros objetos. Histórico local/remoto sincronizado; quatro verificações de segurança aprovadas. Procedimento e limites em [MIGRATIONS.md](docs/MIGRATIONS.md).

Para testar, execute um comando por vez no PowerShell, na pasta do projeto:

```powershell
npx.cmd --no-install supabase migration list --linked
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_security_baseline.sql
git log -1 --oneline
git status
```

Esperado: 20260925015139 em local e remote (mais as migrations de etapas seguintes), quatro resultados passed=true e Git sem alterações pendentes. Git guarda os arquivos, não os dados do banco. Não execute db reset no banco remoto. Teste da etapa 7 confirmado pelo usuário ao continuar.

## Etapa 8 — questões e gabarito protegido

Criadas public.questions e public.question_answers, sem acesso direto de visitantes ou usuários logados. O servidor privilegiado recebe apenas leitura. Migration 20260925085403 aplicada, 51 verificações SQL, seis verificações de segurança e teste HTTP aprovados. As tabelas estavam vazias ao encerrar a etapa 8; a etapa 9 adicionou o lote abaixo.

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npx.cmd --no-install supabase migration list --linked
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_questions_security.sql
npm.cmd run test:questions
```

Esperado: duas migrations sincronizadas, seis passed=true e três testes Node aprovados. Modelo, limites, testes adicionais e tratamento de erros em [QUESTOES.md](docs/QUESTOES.md). Teste da etapa 8 confirmado ao avançar.

## Etapa 9 — seed concluído

Carregadas 10 questões de exemplo e seus gabaritos, duas por matéria, todas em draft. Seed idempotente: repetir não duplica nem sobrescreve conteúdo. Nenhuma nova migration ou publicação de questões.

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_seed.sql
npm.cmd run test:seed
npm.cmd run test:questions
```

Esperado: cinco passed=true, teste de repetição passed=true e três testes da API aprovados. Instruções em [SEED.md](docs/SEED.md); conteúdo completo para revisão humana em [REVISAO-SEED.md](docs/REVISAO-SEED.md). Etapa 10 aguarda seu teste. A confirmação técnica não publica o lote.

## Etapa 10 — tentativa anônima concluída

POST/GET /api/quiz/attempt criam e retomam tentativa por cookie HttpOnly, com hash no banco, expiração de 30 minutos e cópia privada das questões/gabaritos. Apenas questões publicadas são selecionadas. O seed permanece draft; a resposta esperada após configurar a conexão é quiz_not_ready.

Configurar SUPABASE_SECRET_KEY somente em .env.local, sem prefixo NEXT_PUBLIC_. Em produção será necessário APP_ORIGIN HTTPS. Passo a passo, arquivos e limites em [TENTATIVA-ANONIMA.md](docs/TENTATIVA-ANONIMA.md).

```powershell
npm.cmd run test:guest
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_guest_quiz.sql
npm.cmd run test:guest:http
```

O último comando exige o site em modo dev e a chave privada para executar todos os testes. Oito testes isolados, cinco checagens SQL, 26 asserções SQL, build e lint passaram. HTTP: cinco aprovados após configuração da chave e correção do POST vazio; nove testes isolados aprovados. Aguardar teste do usuário antes da etapa 11.

Etapa 10 retomada: chave configurada somente em .env.local e integração verificada. Nenhuma questão publicada. Próxima etapa, após seu teste: mockup do quiz.

## Etapa 11 — interface implementada

Visual aprovado e implementado. Teste em http://127.0.0.1:3000/quiz/preview com `npm.cmd run dev`. Essa prévia repete uma questão ilustrativa em dez posições; não usa o banco e retorna 404 em produção.

Selecione uma alternativa, avance, volte e revise suas escolhas. Continuar fica desabilitado antes da seleção. As escolhas ficam somente na memória da tela; sair ou recarregar as perde. Não há envio, pontuação ou correção nesta etapa.

A entrada abre /quiz, integrado à API da etapa 10. O lote continua draft: indisponibilidade é esperada até revisão editorial. Lint, build, nove testes isolados e cinco HTTP aprovados. Procedimento e limites em [QUIZ-INTERFACE.md](docs/QUIZ-INTERFACE.md). Pausa para seu teste antes da etapa 12.

## Etapa 12 — correção segura concluída

API POST/GET /api/quiz/result implementada: valida dez respostas, corrige pelo snapshot privado e salva resultado definitivo. Reenvio igual não duplica; alteração posterior é recusada. Questões continuam draft. Interface permanece na etapa 11; envio e resultado visual serão conectados na etapa 13 após aprovação do mockup.

Com `npm.cmd run dev` rodando, execute `npm.cmd run test:correction` e `npm.cmd run test:correction:http`: esperado oito e quatro testes aprovados. SQL de verificação, contrato e limites em [CORRECAO-SEGURA.md](docs/CORRECAO-SEGURA.md). Lint/build e testes de regressão aprovados. Pausa para seu teste antes da etapa 13.

## Etapa 13 — escolha visual

Teste da etapa 12 confirmado. Três propostas de resultado em [RESULTADO-MOCKUPS.md](docs/design/RESULTADO-MOCKUPS.md). Usuário escolheu imagem 3 para resumo e imagem 2 para revisão. Os números são ilustrativos; nenhuma questão publicada.

## Etapa 13 — implementação e verificação concluídas

Imagem 3 escolhida para resultado e imagem 2 para revisar erros um a um. Implementado envio do quiz e feedback real, com recuperação por cookie. Teste visual local em http://127.0.0.1:3000/quiz/result/preview (dados ilustrativos). Detalhes em [RESULTADO.md](docs/RESULTADO.md).

Build/lint e 30 testes passaram. Conferência no navegador concluída em 26/09/2026: revisão dos erros e de todas as respostas, zero/dez acertos, finalização da prévia, teclado e larguras 320/390/1280. Evidências em [design-qa.md](design-qa.md). Pausa para seu teste antes da etapa 14; nenhuma questão publicada.
