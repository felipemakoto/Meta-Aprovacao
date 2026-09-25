# Estado do Projeto

Etapa atual: 10 — implementação salva, PAUSADA a pedido do usuário. Falta configurar SUPABASE_SECRET_KEY e concluir o teste HTTP privilegiado. O usuário informou que fará isso futuramente e pediu checkpoint. Dez questões e dez gabaritos continuam em rascunho; revisão humana pendente.

Etapas 1 a 9 concluídas e confirmadas pelo usuário ao continuar. Não iniciar etapa 11 antes de concluir a configuração e o teste da etapa 10.

## Ambiente

- Node 24.20.0; npm 11.19.0.
- Next.js 16.3.6; React / React DOM 19.2.8.
- TypeScript 5.9.3; Tailwind CSS / @tailwindcss/postcss 4.3.3.
- ESLint 9.39.5; eslint-config-next 16.3.6.
- Git 2.53.0.windows.2; branch master; identidade preservada; sem remoto.

Dependências adicionadas na etapa 6: @supabase/supabase-js 2.117.1, @supabase/ssr 0.12.7 e server-only 0.0.1. Etapa 7: supabase CLI 2.117.0 como devDependency. Nenhuma dependência nova nas etapas 8 a 10. Banco remoto com três migrations aplicadas e 10 questões/gabaritos em draft. .env.local contém NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; SUPABASE_SECRET_KEY ainda ausente. Arquivo ignorado pelo Git. APP_ORIGIN HTTPS será necessário em produção. Rotas: /, /api/auth/status, /api/quiz/attempt e página interna de não encontrado do Next.js.

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

Servidor local de desenvolvimento iniciado em http://127.0.0.1:3000 para os testes da etapa 10. Pode precisar ser reiniciado após fechar a sessão ou configurar a chave. Comandos no README.

## Pendências e limites

Projeto estudos-etec/if, referência clxnqrkdalimrqcnhegr, organização meta aprovação, plano Free selecionado na criação. Painel verificado em 24/09/2026: Healthy, região São Paulo (sa-east-1), compute Nano; saúde confirmada pela CLI na etapa 7. Migrations registradas: 20260925015139_initialize_database_security, 20260925085403_create_questions_and_protected_answers e 20260925091427_create_guest_quiz_attempts. Nenhum backup criado por estas etapas. Opções de criação conferidas: Data API ativada, exposição automática de novas tabelas desativada e RLS automático ativado. RLS e GRANTs das duas tabelas definidos explicitamente na migration da etapa 8; sem policies de liberação para clientes.

Login da CLI e vínculo remoto funcionando. Retomada em TENTATIVA-ANONIMA.md. Backend da tentativa implementado com snapshots privados de conteúdo e gabarito, token opaco em cookie, hash no banco e expiração de 30 minutos. Não há interface de quiz, recebimento/correção de respostas, cadastro, login/logout, recuperação, simulados, pagamentos ou publicação. Nenhuma chave administrativa da aplicação obtida; credencial local pendente. Fluxo de revisão/publicação e nome definitivo pendentes.

Verificação da etapa 6: lint e build aprovados; um teste de configuração e cinco de integração passaram. Auth healthcheck remoto 200; homepage 200; rota de sessão devolve 401 sem sessão, com cookie corrompido e com sessão forjada, sempre sem cache. Homepage conferida no navegador. A navegação do navegador integrado para o endpoint 401 foi bloqueada pelo cliente; resposta conferida por HTTP. Testes reais de login e renovação de sessão válida ainda pendentes para as etapas de conta.

Avisos herdados da instalação: ESLint 9 com aviso de fim de suporte e script de instalação do unrs-resolver não aprovado pelo npm. Não alterados nesta etapa; lint e build passaram. Revisar manutenção antes de ampliar dependências.

## Checkpoint e próximo passo

Checkpoint da etapa 9: a4e27b6. Checkpoint parcial da etapa 10: feat: preparar tentativa anonima e registrar pausa; consultar git log -1 --oneline. .env.local e supabase/.temp ficam ignorados. O Git não é um backup do banco remoto.

Próximo passo, quando o usuário retomar: orientar a cópia da Secret key do projeto para SUPABASE_SECRET_KEY em .env.local, reiniciar npm run dev e executar npm run test:guest:http. Esperado: cinco aprovados e nenhum ignorado, incluindo quiz_not_ready porque o lote não foi publicado. Só então concluir etapa 10 e aguardar teste. Etapa 11 começa pelo mockup, sem implementar visual antes da aprovação.

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

## Checkpoint parcial da etapa 10

Migration aplicada e histórico sincronizado. Oito testes isolados, 26 asserções SQL, cinco verificações de catálogo, build e lint aprovados. HTTP real: quatro testes aprovados; um ignorado por ausência de SUPABASE_SECRET_KEY. Testes SQL revertidos; nenhuma publicação persistente do seed. Cookie seguro, CSRF e DTO sem campos privados testados com dependências simuladas. Teste positivo completo de aplicação com conteúdo publicado ainda pendente. Nenhuma credencial exposta ou incluída no Git. Pausa solicitada pelo usuário; não avançar automaticamente.
