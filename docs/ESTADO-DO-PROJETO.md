# Estado do Projeto

Etapa atual: 9 — seed concluído, aguardando teste do usuário. O pedido para fazer a etapa 9 confirmou o teste da etapa 8. Dez questões e dez gabaritos inseridos como rascunho; revisão humana pendente.

Etapas 1 a 8 concluídas e confirmadas pelo usuário ao continuar. Os pedidos anteriores para continuar foram aceitos como confirmação dos testes das etapas anteriores.

## Ambiente

- Node 24.20.0; npm 11.19.0.
- Next.js 16.3.6; React / React DOM 19.2.8.
- TypeScript 5.9.3; Tailwind CSS / @tailwindcss/postcss 4.3.3.
- ESLint 9.39.5; eslint-config-next 16.3.6.
- Git 2.53.0.windows.2; branch master; identidade preservada; sem remoto.

Dependências adicionadas na etapa 6: @supabase/supabase-js 2.117.1, @supabase/ssr 0.12.7 e server-only 0.0.1. Etapa 7: supabase CLI 2.117.0 como devDependency. Nenhuma dependência nova nas etapas 8 e 9. Banco remoto com duas migrations aplicadas, 10 questões e 10 gabaritos de exemplo em draft. .env.local contém somente NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, obtidas do painel. Arquivo ignorado pelo Git. Rotas: /, /api/auth/status e página interna de não encontrado do Next.js.

## O que funciona

- Entrada responsiva com título serifado, marca-texto e CTA, seguindo docs/design/entrada-mobile-v4.png.
- Card “10 questões” removido e posições preservadas conforme aprovação.
- Botão acessível por teclado mostra aviso de teste em preparação, sem criar tentativa ou simular diagnóstico.
- Fontes servidas pela aplicação e ícones Heroicons locais com licença.
- Banco de questões e gabarito separados, com RLS e bloqueio de acesso direto para anon/authenticated; leitura privilegiada testada no PostgreSQL.

## Verificações da etapa 4

- npm run build: aprovado, incluindo TypeScript e geração estática.
- npm run lint: aprovado.
- Navegador em 320, 390 e 1280px: sem overflow horizontal; fontes e ícones carregados.
- Tab/Enter: foco visível e aviso exibido. Clique repetido não duplica mensagem.
- Nenhum erro ou aviso no console durante a verificação.
- Comparação visual com mockup e evidências em design-qa.md.

Servidor local de produção iniciado para revisão em http://localhost:3000 após build. Servidores precisam ser iniciados novamente após fechar a sessão ou reiniciar o computador. Comandos de desenvolvimento no README.

## Pendências e limites

Projeto estudos-etec/if, referência clxnqrkdalimrqcnhegr, organização meta aprovação, plano Free selecionado na criação. Painel verificado em 24/09/2026: Healthy, região São Paulo (sa-east-1), compute Nano; saúde confirmada pela CLI na etapa 7. Migrations registradas: 20260925015139_initialize_database_security e 20260925085403_create_questions_and_protected_answers. Nenhum backup criado por estas etapas. Opções de criação conferidas: Data API ativada, exposição automática de novas tabelas desativada e RLS automático ativado. RLS e GRANTs das duas tabelas definidos explicitamente na migration da etapa 8; sem policies de liberação para clientes.

Login da CLI concluído pelo usuário e vínculo remoto funcionando. Teste atual em SEED.md. Clientes de navegador/servidor, renovação via Proxy e verificação de identidade no servidor implementados. Seed implementado; cadastro, login/logout, recuperação, demais tabelas de negócio, quiz, simulados, pagamentos e publicação ainda não implementados. Antes de salvar tentativas, implementar preservação de versões e conteúdo usado; fluxo de revisão/publicação ainda pendente. Nenhuma chave administrativa da aplicação obtida; autenticação da CLI permanece no armazenamento próprio. Nome definitivo da plataforma pendente.

Verificação da etapa 6: lint e build aprovados; um teste de configuração e cinco de integração passaram. Auth healthcheck remoto 200; homepage 200; rota de sessão devolve 401 sem sessão, com cookie corrompido e com sessão forjada, sempre sem cache. Homepage conferida no navegador. A navegação do navegador integrado para o endpoint 401 foi bloqueada pelo cliente; resposta conferida por HTTP. Testes reais de login e renovação de sessão válida ainda pendentes para as etapas de conta.

Avisos herdados da instalação: ESLint 9 com aviso de fim de suporte e script de instalação do unrs-resolver não aprovado pelo npm. Não alterados nesta etapa; lint e build passaram. Revisar manutenção antes de ampliar dependências.

## Checkpoint e próximo passo

Checkpoint da etapa 8: ea39209. Checkpoint da etapa 9: feat: adicionar seed de questoes em rascunho; consultar git log -1 --oneline. .env.local e supabase/.temp ficam ignorados. O Git não é um backup do banco remoto.

Próximo passo: usuário executar verify_seed.sql, npm run test:seed e npm run test:questions. Esperado: cinco passed=true, preservação de dados passed=true e três testes Node aprovados. Revisar conteúdo em REVISAO-SEED.md. Após confirmação técnica, etapa 10 — tentativa anônima; conteúdo público ainda depende de revisão humana explícita.

## Conclusão da etapa 7

CLI supabase 2.117.0 adicionada como devDependency. init, migration new e link executados. Migration 20260925015139_initialize_database_security.sql aplicada após dry-run: schema private e privilégios restritivos para objetos futuros de postgres. Consulta supabase/tests/verify_security_baseline.sql executada com quatro resultados true; histórico local/remoto sincronizado.

projects list confirmou acesso e projeto ACTIVE_HEALTHY após login. PostgreSQL remoto 17.6, compatível com major_version=17. Docker não encontrado no PATH; nenhuma stack local iniciada, nenhum reset executado. config.toml ajustado apenas localmente (sem config push). Uma falha transitória em chamadas simultâneas da CLI foi resolvida repetindo migration list isoladamente; usar comandos sequenciais. Detalhes em MIGRATIONS.md. Código Next.js e interface preservados; lint/build anteriores não repetidos para esta alteração de SQL, CLI e documentação.

## Conclusão da etapa 8

Criadas public.questions e public.question_answers com cinco alternativas obrigatórias, metadados validados, versão positiva, status draft por padrão, integridade referencial e timestamps por trigger. Sem permissões diretas para visitantes/usuários comuns; service_role com apenas SELECT nas duas tabelas. Não houve alteração de interface, novas rotas ou inclusão de credenciais.

Dry-run e aplicação remota concluídos; 51 verificações SQL de comportamento aprovadas com rollback, seis verificações de catálogo aprovadas, três testes Node da API pública e lint aprovados. Tabelas confirmadas vazias após o teste. Histórico local/remoto sincronizado. Papel authenticated verificado no PostgreSQL, sem login real de aplicação. Build não repetido; não houve mudança em código de aplicação. Docker local continua indisponível. Critérios cumpridos e pausa para teste do usuário.

## Conclusão da etapa 9

supabase/seed.sql carregou 10 questões originais de exemplo, duas por matéria, com cinco alternativas e gabarito explicado. Todos os registros em draft, versão 1, target_exam=both. IDs estáveis e inserção atômica; reexecução preserva conteúdo, status e timestamps. Sem nova migration: permanecem as duas versões anteriores. Seed local habilitado em config.toml, sem envio de configuração ao remoto.

Cinco verificações de conteúdo aprovadas após carga e após teste transacional de duas reexecuções. O teste simulou revisão editorial sem sobrescrita e reverteu suas alterações. Três testes de API com dados presentes e lint aprovados. Implementação do teste usa Node, sem alterar política de execução do Windows. Docker indisponível; carga automática local não testada. Build não repetido; código da aplicação preservado. Nenhuma dependência, variável ou rota nova.

Documentação em SEED.md e revisão integral em REVISAO-SEED.md. Conferência técnica não é aprovação pedagógica: revisão humana pendente, nenhuma questão publicada. Pausa para teste antes da etapa 10.
