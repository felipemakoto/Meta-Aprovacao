# Estado do Projeto

Etapa atual: 6 — clientes Supabase e autenticação base implementados em 24/09/2026. O pedido “continue” confirmou o teste da etapa 5. Aguardando teste do usuário antes da etapa 7 (migrations).

Etapas 1 a 6 implementadas; teste do usuário da etapa 6 pendente. Os pedidos anteriores para continuar foram aceitos como confirmação dos testes das etapas anteriores.

## Ambiente

- Node 24.20.0; npm 11.19.0.
- Next.js 16.3.6; React / React DOM 19.2.8.
- TypeScript 5.9.3; Tailwind CSS / @tailwindcss/postcss 4.3.3.
- ESLint 9.39.5; eslint-config-next 16.3.6.
- Git 2.53.0.windows.2; branch master; identidade preservada; sem remoto.

Dependências adicionadas na etapa 6: @supabase/supabase-js 2.117.1, @supabase/ssr 0.12.7 e server-only 0.0.1. Banco remoto provisionado; nenhuma tabela de negócio ou migration criada. .env.local contém somente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, obtidas do painel. Arquivo ignorado pelo Git. Rotas: /, /api/auth/status e página interna de não encontrado do Next.js.

## O que funciona

- Entrada responsiva com título serifado, marca-texto e CTA, seguindo docs/design/entrada-mobile-v4.png.
- Card “10 questões” removido e posições preservadas conforme aprovação.
- Botão acessível por teclado mostra aviso de teste em preparação, sem criar tentativa ou simular diagnóstico.
- Fontes servidas pela aplicação e ícones Heroicons locais com licença.

## Verificações da etapa 4

- npm run build: aprovado, incluindo TypeScript e geração estática.
- npm run lint: aprovado.
- Navegador em 320, 390 e 1280px: sem overflow horizontal; fontes e ícones carregados.
- Tab/Enter: foco visível e aviso exibido. Clique repetido não duplica mensagem.
- Nenhum erro ou aviso no console durante a verificação.
- Comparação visual com mockup e evidências em design-qa.md.

Servidor local de produção iniciado para revisão em http://localhost:3000 após build. Servidores precisam ser iniciados novamente após fechar a sessão ou reiniciar o computador. Comandos de desenvolvimento no README.

## Pendências e limites

Projeto estudos-etec/if, referência clxnqrkdalimrqcnhegr, organização meta aprovação, plano Free selecionado na criação. Painel verificado em 24/09/2026: Healthy, região São Paulo (sa-east-1), compute Nano. Nenhuma migration ou backup registrado. Opções de criação conferidas: Data API ativada, exposição automática de novas tabelas desativada e RLS automático ativado. Políticas de acesso reais serão implementadas e testadas na etapa 7.

O usuário precisa testar os comandos da etapa 6, documentados em AUTH-BASE.md. Clientes de navegador/servidor, renovação via Proxy e verificação de identidade no servidor implementados. Cadastro, login/logout, recuperação, esquema de negócio, quiz, simulados, pagamentos e publicação ainda não implementados. Nenhuma chave privada obtida. Nome definitivo da plataforma pendente.

Verificação da etapa 6: lint e build aprovados; um teste de configuração e cinco de integração passaram. Auth healthcheck remoto 200; homepage 200; rota de sessão devolve 401 sem sessão, com cookie corrompido e com sessão forjada, sempre sem cache. Homepage conferida no navegador. A navegação do navegador integrado para o endpoint 401 foi bloqueada pelo cliente; resposta conferida por HTTP. Testes reais de login e renovação de sessão válida ainda pendentes para as etapas de conta.

Avisos herdados da instalação: ESLint 9 com aviso de fim de suporte e script de instalação do unrs-resolver não aprovado pelo npm. Não alterados nesta etapa; lint e build passaram. Revisar manutenção antes de ampliar dependências.

## Checkpoint e próximo passo

Checkpoint da etapa 5: 819962a. Checkpoint da etapa 6: feat: configurar clientes Supabase e autenticacao base; consultar git log -1 --oneline para seu hash. .env.local não integra o commit. O Git não é um backup do banco remoto.

Próximo passo: aguardar teste do usuário da etapa 6. Após confirmação, iniciar etapa 7 (migrations), consultando documentação oficial atual. Não antecipar telas de conta ou quiz.
