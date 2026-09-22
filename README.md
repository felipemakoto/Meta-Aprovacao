# Preparação ETEC / IF

Plataforma em construção. Etapa 1: projeto Next.js padrão. A página de exemplo não é o visual final.

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
