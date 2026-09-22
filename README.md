# Preparação ETEC / IF

Plataforma em construção. Etapas 1 e 2: projeto Next.js padrão e fluxo de checkpoints Git. A página de exemplo não é o visual final.

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

Depois do fechamento desta etapa, o status deve mostrar `On branch master` e `nothing to commit, working tree clean`. Isso significa que os arquivos estão salvos no Git. O histórico deve começar por `docs: documentar fluxo Git da etapa 2`; o código antes da mensagem identifica o commit.

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
Nenhuma variável ou credencial necessária. .env* está ignorado pelo Git. Nunca inserir chaves privadas no código, em logs ou na documentação.

## Arquivos
- src/app/page.tsx: página inicial, rota /.
- src/app/layout.tsx: estrutura compartilhada.
- src/app/globals.css: CSS do exemplo oficial; não é o design aprovado do produto.
- public/: imagens públicas do exemplo.
- docs/DECISIONS.md: decisões técnicas.
- docs/ESTADO-DO-PROJETO.md: progresso.

## Teste manual e erros
Abra http://localhost:3000. Deve aparecer Next.js e a instrução em inglês para editar page.tsx. Não é necessário clicar em Deploy Now.
Se não abrir, confira Ready no terminal e a porta indicada. Se um comando não for encontrado, reabra o PowerShell. Caso persista, envie a mensagem do erro sem credenciais.

## Documentação oficial
- https://nodejs.org/en/about/previous-releases
- https://nodejs.org/en/download
- https://nextjs.org/docs/app/getting-started/installation
- https://nextjs.org/docs/app/api-reference/cli/create-next-app
