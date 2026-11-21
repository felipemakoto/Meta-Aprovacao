# PWA — Meta Aprovação

Implementação local em 24/10/2026. O commit `f66fab8` das configurações e proteções Premium foi publicado em produção e confirmado como concluído pela Vercel antes deste trabalho. Publicação do PWA autorizada pelo usuário após os ajustes das configurações e a validação final. Nenhuma migração, dependência, regra comercial, autenticação ou operação Cakto foi adicionada/alterada para o PWA.

## Arquivos

- `next.config.ts`: versão central e cabeçalhos de worker/versão.
- `src/lib/pwa/{release,platform,worker}.ts`: identidade da versão, instruções por navegador e política restrita de cache.
- `src/app/manifest.ts`, `src/app/sw.js/route.ts`, `src/app/app-version.json/route.ts`: manifest e endpoints públicos estáticos.
- `src/app/pwa/{provider,application-panel}.tsx`, `src/app/pwa/pwa.module.css`: contexto, instalação, detecção e gerenciamento de versão.
- `src/app/baixar/{page,download-page}.tsx`: página pública de instalação.
- `public/offline.html`, `public/pwa/{icon-192,icon-512,maskable-512,apple-180}.png`, `public/favicon.ico`: fallback e ícones derivados da logo SVG original, preservada.
- `src/app/{layout,page,study-shell}.tsx`, `src/app/globals.css`, `src/app/configuracoes/settings-panel.tsx`: metadados, safe areas, menu contextual e seção permanente Aplicativo.
- `tests/pwa.test.mjs`: testes de contrato, cache executado em VM, imagens, plataformas e renderização dos estados.

## Comportamento

- `/baixar` público; Instalar nos menus existentes, sem alterar outros destinos. Antes da identificação do contexto, o link não aparece; não há flash na abertura standalone.
- Seção Aplicativo disponível a qualquer plano autenticado em `/configuracoes?secao=app`. No modo instalado mostra versão atual e não sugere reinstalação. `/baixar` nesse contexto oferece continuar os estudos/configurações.
- Contexto usa `display-mode: standalone` e `navigator.standalone`; acompanha mudanças e `appinstalled`. Um evento de instalação em uma aba comum não transforma essa aba em aplicativo. Não há persistência de instalação em localStorage.
- Pedido nativo `beforeinstallprompt` somente por clique; quando indisponível, instruções adequadas ao sistema e navegador. Sem lojas/downloads executáveis, notificações invasivas ou instalação automática.
- Versão: versão real do `package.json` + commit publicado `VERCEL_GIT_COMMIT_SHA`. Na compilação local sem esse campo, hash SHA-256 dos arquivos reais de src/public/configuração e dependências, incluindo alterações ainda não commitadas. Falha de identificação exibe estado informativo. Valores públicos congelados no build e compartilhados entre interface, worker e endpoint de versão, sem divulgar variáveis privadas.
- Worker registrado somente em build de produção e contexto seguro (HTTPS ou loopback). A Vercel oferece HTTPS; desenvolvimento/HMR não instala worker. Testar offline usando build de produção, não `next dev`.
- Precache **somente** `offline.html` e quatro PNGs públicos. Requisições de precache omitem credenciais. Nada de HTML personalizado, RSC, chunks, respostas, autenticação, APIs, PDFs privados ou pagamentos é guardado no cache pelo worker. Nenhum armazenamento de dados pessoais foi adicionado.
- Navegações usam rede e, em falha de conexão, tela offline estática. Respostas HTTP de erro do servidor não são mascaradas como sucesso. A tela não promete envio/salvamento offline.
- Atualização verificada ao retomar a página/conexão. Aviso discreto, botão em Aplicativo e confirmação explícita. Configurações com rascunho impedem atualização. Não há reload automático de outras abas nem `skipWaiting` no install. Ativação limpa somente caches `meta-public-` antigos; outras caches são preservadas. Ao aceitar atualizar, a aba atual recarrega, portanto é necessário concluir/salvar atividades antes.

## Verificação

- Suíte local anterior + novos testes: **318 testes aprovados**, sem falhas.
- Build de produção aprovado; lint sem erros, 94 avisos preexistentes.
- Chromium real: manifest sem erros; worker registrado/controlando a página; inspeção do CacheStorage mostrou exatamente os cinco arquivos públicos; tela offline real com rede desconectada; atualização real entre dois builds, ativação por confirmação e remoção do cache anterior.
- Página pública sem overflow em 320, 390, 768 e 1280 px. Configurações → Aplicativo sem overflow em 320, 390 e 1280 px.
- Conta temporária identificada: login, seção Aplicativo, modo web, ocultação de instalação e alternativa de `/baixar` após mudança simulada de display-mode. Conta de teste removida e ausência confirmada. Nenhuma compra ou assinatura real alterada.
- Distinção testada entre evento appinstalled e efetivo modo standalone. Detecção iPhone/iPad/Mac/Android/Firefox e estados da interface cobertos por testes locais.

## Instalação e limites

Após publicar o PWA em HTTPS:

1. Android: Chrome/Edge → Instalar no site ou menu → Instalar aplicativo/Adicionar à tela inicial.
2. iPhone/iPad: Safari → Compartilhar → Adicionar à Tela de Início → Adicionar.
3. Windows/Linux/macOS: Chrome/Edge → ícone de instalação na barra de endereço/menu. Safari compatível no Mac → Arquivo → Adicionar ao Dock.

Abrir pelo ícone para executar standalone. No Firefox desktop pode ser necessário usar navegador compatível. O navegador controla a oferta e o nome exato das opções.

**Não testado:** instalação física em Android/iPhone/iPad/macOS/Linux, integração com Dock/menu do sistema e experiência standalone nativa do sistema. O Chromium automatizado usa contexto anônimo e reportou `in-incognito` como único impedimento de instalação; não se afirma ter concluído uma instalação nativa. A verificação dos estados standalone utilizou mudança simulada da API de mídia, sem fingir teste de dispositivo.

Offline permite somente orientação de reconexão, sem executar login/questões/simulados/pagamentos nem salvar novas respostas. Não há push em segundo plano. Autorização Premium e sincronização continuam dependentes dos servidores existentes. Uma aba já aberta pode continuar exibindo sua versão até o usuário atualizar; o indicador instalado representa seu bundle carregado, não promete atualização silenciosa.

Ajustes finais de configurações: espaçamento ampliado, redefinição de senha em botão, logout vermelho, remoção de textos/atalhos auxiliares e bloqueio de preferências exclusivas no Gratuito. O servidor rejeita alterações em quantidade/duração de simulado personalizado e avisos exclusivos sem Premium ativo. Preferências anteriores são preservadas no downgrade.
