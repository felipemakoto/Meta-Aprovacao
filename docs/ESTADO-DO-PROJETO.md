# Estado do Projeto

Estado atual em 29/09/2026: etapa 16 concluída. Após a correção 7835cc5, o usuário confirmou: “Sim, os dois funcionaram”, referindo-se a salvar a nova senha e entrar na conta usando ela. Validação manual feita pelo usuário, sem compartilhar credenciais. Escopo da etapa 17 preparado em ASSOCIAR-TENTATIVA.md; implementação não iniciada. Os registros abaixo preservam o histórico das etapas.

Correção da etapa 16 em 29/09/2026: diferença de cerca de 380s entre relógio local e Supabase fazia a recuperação aparecer como confirmação de cadastro. Validação agora usa horário HTTPS do provedor; recuperação inválida não vira sucesso de cadastro. Formulário protegido Nova senha conferido com a sessão real do usuário. Aguardando ele salvar a nova senha e testar login.

Atualização de 29/09/2026: etapa 16 implementada após aprovação visual. Recuperar senha, callback compartilhado que verifica recuperação e Nova senha protegida concluídos. 41 testes, lint, build e verificações de produção passaram. Aguardando teste real do usuário com e-mail, nova senha e login. Instruções e limites em RECUPERACAO-SENHA.md. Nenhuma credencial/configuração remota alterada pelo agente. Etapa 17 não iniciada; etapa 15 concluída e confirmada (b6ecd7b).

Atualização de 28/09/2026: etapa 15 implementada após aprovação do mockup. Login/logout, sessão SSR, estado autenticado e links concluídos; 30 testes, lint, build e QA visual passaram. Sessão existente reconhecida e preservada na recarga. Usuário confirmou em 28/09/2026 que o teste de sair, entrar novamente e recarregar funcionou. Etapa 15 concluída (implementação 1d9d853). Procedimento e limites em LOGIN.md. Etapa 16 não iniciada.

Etapa anterior concluída: 14 — cadastro implementado em 27/09/2026 com a opção 2 aprovada. Visual, build/lint e 21 testes passaram; usuário confirmou o sucesso real do cadastro e da confirmação de e-mail em 28/09/2026. Roteiro em CADASTRO.md. Etapa 13 confirmada; questões permanecem draft.

Etapas 1 a 11 concluídas e confirmadas pelo usuário. Etapa 12: API de correção, persistência e recuperação do resultado; integração visual fica para a etapa 13.

## Ambiente

- Node 24.20.0; npm 11.19.0.
- Next.js 16.3.6; React / React DOM 19.2.8.
- TypeScript 5.9.3; Tailwind CSS / @tailwindcss/postcss 4.3.3.
- ESLint 9.39.5; eslint-config-next 16.3.6.
- Git 2.53.0.windows.2; branch master; identidade preservada; sem remoto.

Dependências adicionadas na etapa 6: @supabase/supabase-js 2.117.1, @supabase/ssr 0.12.7 e server-only 0.0.1. Etapa 7: supabase CLI 2.117.0 como devDependency. Nenhuma dependência nova nas etapas 8 a 12. Banco remoto com quatro migrations aplicadas e 10 questões/gabaritos em draft. .env.local contém NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; SUPABASE_SECRET_KEY configurada localmente e validada, sem exibição do valor. Arquivo ignorado pelo Git. APP_ORIGIN HTTPS será necessário em produção. Rotas: /, /api/auth/status, /api/quiz/attempt e página interna de não encontrado do Next.js.

## O que funciona

- Entrada responsiva com título serifado, marca-texto e CTA, seguindo docs/design/entrada-mobile-v4.png.
- Card “10 questões” removido e posições preservadas conforme aprovação.
- CTA abre /quiz e consulta a API da tentativa; /quiz/preview permite testar o visual somente em desenvolvimento.
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

Login da CLI e vínculo remoto funcionando. Retomada em TENTATIVA-ANONIMA.md. Backend da tentativa implementado com snapshots privados de conteúdo e gabarito, token opaco em cookie, hash no banco e expiração de 30 minutos. Há interface de quiz, backend de correção e integração visual de envio/resultado; ainda não há cadastro, login/logout, recuperação de conta, simulados, pagamentos ou publicação. Credencial administrativa configurada pelo usuário somente em .env.local, ignorado pelo Git. Fluxo de revisão/publicação e nome definitivo pendentes.

Verificação da etapa 6: lint e build aprovados; um teste de configuração e cinco de integração passaram. Auth healthcheck remoto 200; homepage 200; rota de sessão devolve 401 sem sessão, com cookie corrompido e com sessão forjada, sempre sem cache. Homepage conferida no navegador. A navegação do navegador integrado para o endpoint 401 foi bloqueada pelo cliente; resposta conferida por HTTP. Testes reais de login e renovação de sessão válida ainda pendentes para as etapas de conta.

Avisos herdados da instalação: ESLint 9 com aviso de fim de suporte e script de instalação do unrs-resolver não aprovado pelo npm. Não alterados nesta etapa; lint e build passaram. Revisar manutenção antes de ampliar dependências.

## Checkpoint e próximo passo

Checkpoint da etapa 10: cadae2d. Proposta visual da etapa 11: docs: registrar mockup do quiz para aprovacao; consultar git log -1 --oneline. Credenciais continuam fora do Git.

Próximo passo: etapa 17, associar tentativa à conta, conforme ASSOCIAR-TENTATIVA.md. Cadastro, login/logout e recuperação de senha concluídos e confirmados pelo usuário. SMTP padrão continua restrito aos e-mails permitidos pelo Supabase. Aprovação visual não publica o lote de questões.

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

## Retomada e conclusão da etapa 10

Chave privada configurada pelo usuário e integração real aprovada, sem exibição de credenciais. Corrigida rejeição indevida de POST vazio representado por stream no Next. Nove testes isolados e cinco HTTP passaram; nenhum ignorado. Build e lint verificados após a correção. Sem mudança no banco ou publicação de questões. O caminho positivo completo com conteúdo aprovado ainda depende da revisão editorial; testes positivos isolados e no PostgreSQL já foram realizados. A pausa anterior terminou; aguardar teste antes da etapa 11.

## Etapa 11 — proposta visual

Mockup mobile gerado e salvo em docs/design/quiz-mobile-v1.png. Especificação e prompt em docs/design/QUIZ-MOCKUP.md. Questão por tela, título serifado, progresso e cinco opções com CTA desabilitado até seleção. Imagem conferida; nenhuma mudança na aplicação, no banco ou nas dependências. Testes de código não repetidos porque só foram adicionados artefatos visuais e documentação. Aguardando aprovação antes da implementação.

## Conclusão da etapa 11

Interface aprovada implementada: uma questão por tela, alternativas nativas, seleção por teclado, progresso, retorno e revisão das escolhas. Preview separado e exclusivo de desenvolvimento, 404 confirmado em produção. Nenhum envio ou resultado simulado. Escolhas em memória, perdidas ao sair/recarregar. Falta de questões publicadas verificada no fluxo real.

Lint/build, nove testes isolados e cinco HTTP aprovados. Navegador em 320/390/1280px, navegação pelas dez posições, teclado, foco e retorno conferidos. Sem erros ou avisos capturados no console. Comparação visual em design-qa.md. Nenhuma dependência, migration ou publicação de conteúdo. Checkpoint: feat: implementar interface do quiz aprovada (consultar git log -1 --oneline). Pausa para teste antes da etapa 12.

## Conclusão da etapa 12

Migration 20260926022707 aplicada; quatro versões sincronizadas. POST/GET /api/quiz/result, cookie como identidade, validação de dez respostas, pertinência ao snapshot, correção atômica e feedback persistido. Reenvio igual é idempotente; modificação depois de finalizar recebe 409. Acesso até o prazo original da tentativa. RLS e grants restritos. Interface da etapa 11 preservada até o mockup de resultado da etapa 13.

Oito testes isolados, quatro HTTP, 35 verificações SQL e cinco checagens de permissões aprovados. Regressão da tentativa: nove isolados, cinco HTTP e 26 SQL aprovados. Lint/build aprovados; seed confirmado draft após rollback dos testes. Concorrência real com duas conexões e timeout de leitura não exercitados; limites em CORRECAO-SEGURA.md. Checkpoint: feat: adicionar correcao segura do quiz (git log -1 --oneline). Pausa para teste do usuário.

## Etapa 13 — proposta visual

Três imagens em docs/design/resultado-opcao-1.png, resultado-opcao-2.png e resultado-opcao-3.png, numeradas na ordem em que foram exibidas. Brief e limites em design/RESULTADO-MOCKUPS.md. Somente imagens e documentação; aplicação e banco preservados. Aguardar escolha antes de implementar envio e resultado.

## Etapa 13 — implementação e verificação concluídas

Usuário escolheu resumo da imagem 3 e revisão da imagem 2 para ver os erros um a um. Implementadas rotas /quiz/result e prévia exclusiva de desenvolvimento; envio ao finalizar, retry idempotente, recuperação por cookie, filtro dos erros, navegação por questão e revisão de todas. 0/10 e 10/10 previstos. Nada publicado no banco.

Build/lint e 30 testes passaram. Prévia 404 em produção. O checkpoint 189e13d ficou inicialmente sem validação visual devido à ferramenta indisponível. Após restabelecer servidor e navegador, foram comparadas capturas com imagens 3 e 2 e testadas revisão dos três erros, todas as dez respostas, abertura direta de erro, retorno ao resumo, zero/dez acertos, finalização da prévia por teclado e foco. Sem overflow em 320/390/1280px; console sem erros/avisos capturados. design-qa.md passed, com diferenças menores e limites registrados. Somente documentação/evidências mudaram nesta retomada. Instruções em RESULTADO.md; pausa para teste do usuário. Nenhuma publicação de questões ou alteração no banco.
