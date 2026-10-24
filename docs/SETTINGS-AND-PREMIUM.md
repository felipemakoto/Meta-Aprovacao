# Configurações, privacidade e acesso Premium

Implementação local de 24/10/2026. Interface em `http://127.0.0.1:3000/configuracoes`; o deploy da Vercel não foi executado. As migrações aditivas foram aplicadas ao banco vinculado, sem alterar preços, assinaturas reais, checkout, históricos existentes ou permissões do Gratuito. Nenhuma dependência de produção foi adicionada.

## Funcionalidades e integração

- `/configuracoes`: dez categorias, navegação lateral no desktop e seletor no celular. A engrenagem da conta abre esse painel. Nome e foto reutilizam o editor privado existente.
- Logout apenas ao final de Minha conta; usa o endpoint existente, encerra a sessão local e faz navegação completa para descartar conteúdo autenticado em cache.
- Preferências pessoais no JSON privado do perfil; identidade derivada da sessão verificada, validação de campos no cliente/servidor, rejeição de propriedades desconhecidas, limite de corpo e APIs sem cache compartilhado. Leituras gerais usam `?view=preferences` para evitar consultar sessões em toda página.
- Autosave nas opções simples de aparência e avisos; confirmação para metas, horários e configurações relacionadas. Rascunhos permanecem ao trocar categorias e há aviso antes de abandonar alterações não salvas. Autosave de uma opção não confirma silenciosamente outros campos pendentes.
- Senha usa a recuperação existente. E-mail é o usuário de acesso, exibido sem introduzir um segundo sistema de identidade.

| Preferência | Efeito real |
|---|---|
| ETEC/IF/ambos | Filtro inicial do banco de questões; instituição compatível como padrão de um plano novo |
| Curso e instituição desejada | Contexto do objetivo no dashboard, sem fingir vínculo com edital ou recomendação por curso |
| Data da prova | Contagem por data de São Paulo e valor inicial de um plano novo |
| Meta, dias e minutos | Dashboard e padrões de novo cronograma; não aumentam limites do Gratuito |
| Matérias prioritárias | Matéria inicial da prática e ponderação do planejamento Premium, preservando orçamento e amostras mínimas do diagnóstico |
| Dificuldade | Padrão inicial da prática e do simulado personalizado; não sobrescreve uma questão retomada ou escolhas já editadas |
| Explicações | Exibir a correção existente imediatamente ou sob demanda; sem geração de texto/IA |
| Quantidade e duração | Valores iniciais do simulado personalizado; provas realistas mantêm regras verificadas |
| Destaque do painel | Destaque visual da meta, mantendo atividade, resultados e recursos gratuitos |
| Tema, leitura ampliada, contraste, densidade e animações | Estilos do site e preferência de movimento; foco permanece disponível para todos |
| Avisos de estudo/revisão e silêncio | Filtros dos lembretes reais da aba de estudos, considerando horário de Brasília e intervalos atravessando meia-noite |

Um cronograma já editado mantém sua própria configuração. Objetivos gerais preenchem um plano novo; prioridades pessoais também entram na adaptação. A arquitetura atual continua com uma instituição por perfil de cronograma. “Ambos” vale para a preparação geral/banco de questões, não cria um formato de prova híbrido.

Somente preferências visuais são copiadas ao armazenamento local. Curso, escola e objetivos permanecem no banco/memória da sessão, sem cache permanente desses dados no navegador. Preferências e foto continuam privadas; nenhum bucket público foi criado.

## Privacidade e exclusão

- Sessões listadas por data, sem tokens. Encerrar outras sessões usa a operação oficial do Supabase. Access tokens já emitidos podem durar até a expiração; não foi alterada a política de JWT do projeto.
- Exportação autenticada de perfil, preferências, foto convertida, respostas/atividade, planejamento, revisões, registros próprios de assinatura e quizzes iniciais salvos. Colunas explícitas evitam exportar snapshots protegidos, hashes de acesso, senhas, cookies ou chaves. Limite de 5.000 registros por coleção, sinalizado por `truncated`, e teto da exportação principal de 8 MB; volumes maiores exigem suporte.
- Exclusão exige digitar `EXCLUIR` e confirmar a senha atual. Para Google exige OAuth recente, de até cinco minutos, verificado nos claims do servidor, sem aceitar recuperação de senha como reautenticação OAuth.
- Senha é verificada com cliente isolado, sem substituir a sessão atual. As operações reutilizam a cota privada de alterações por conta; requisições não aceitam ID de outro usuário.
- A transação bloqueia a linha do usuário, verifica vínculos financeiros/storage e remove a conta Auth com cascatas de dados aplicáveis e sessões. Falha reverte o conjunto; a resposta `deleted` depende da remoção confirmada. Uma sessão da conta removida deixa de ser aceita nas APIs do site.
- **Limitação intencional:** qualquer assinatura, intenção de checkout ou tentativa de pagamento impede exclusão automática. Isso inclui registros históricos e intenções ainda não conciliadas. Não há cancelamento Cakto automático inventado, nem exclusão de evidência financeira antes de conferência. O botão permanece disponível, mas o backend responde 409 e orienta atendimento nesses casos.
- O comprador pode gerenciar a assinatura no [portal da Cakto](https://assinatura.cakto.com.br/), indicado pela [central oficial](https://www.cakto.com.br/contato). A aplicação não trata abrir o portal como cancelamento confirmado. Cancelamento não é reembolso.
- Resultados anônimos desvinculados e cópias de segurança anteriores seguem a política de conservação existente; a interface não promete apagar imediatamente todos os arquivos de backup.

## Premium

- As oito áreas atuais vêm do catálogo canônico `studyAreas`, incluindo revisão e flashcards já unidos.
- Dashboard, hub Premium e configurações apresentam nomes/descrições. Os simulados também podem exibir metadados seguros do catálogo publicado que não estejam liberados naquele plano.
- O clique comum em links para estudos Premium consulta `/api/limits` sem cache. Sem acesso, abre um único modal reutilizável com benefício, Conhecer Premium e Voltar. Não inicia checkout, cobrança, simulado ou leitura paga.
- Links abertos diretamente/nova aba continuam sujeitos às verificações do servidor. O hub gratuito mostra o catálogo, sem dados de workspace.
- A autorização de conteúdo/ações permanece nas rotas, DAL e RPCs existentes; o cadeado não é a proteção de segurança.
- Mudanças de plano são refletidas em novas verificações, foco/visibilidade e vencimento do acesso. O workspace atualiza a página ao perder acesso. Dados de estudo não são apagados no downgrade.
- Configurações pessoais, objetivos básicos, leitura, segurança, privacidade, exportação, logout e exclusão são gratuitos. Elas não liberam execução de recursos Premium. As classificações comerciais existentes foram preservadas.

## Migrações e implantação

Aplicadas ao projeto Supabase vinculado:

1. `20261024202325_account_preferences_privacy.sql`: preferências, aparência sem sobrescrever nome/foto, sessões, exportação, prévias seguras e exclusão transacional restrita a contas sem vínculos financeiros.
2. `20261024205546_account_notification_preferences.sql`: extensão compatível das preferências para avisos/silêncio; aceita também o documento anterior de 16 campos.
3. `20261024211822_account_quiz_export.sql`: exportação dos quizzes iniciais pertencentes ao usuário, sem hashes/bearer.

RLS do perfil permanece ativa. Todas as novas RPCs revogam execução de PUBLIC/anon/authenticated e concedem somente ao servidor (`service_role`). Não existe RPC pública de alteração de plano.

Publicar somente depois dessas migrações. Para rollback da aplicação, mantenha os dados/RPCs aditivos enquanto houver instâncias novas em uso; não apague preferências como parte do rollback. A política de privacidade local foi atualizada para a versão `2026-10-24.3`.

Ambiente local: `.env.local`, ignorado pelo Git, recebeu somente `APP_ORIGIN=http://127.0.0.1:3000`. Credenciais não foram modificadas. O deploy continua usando a origem HTTPS da sua própria configuração.

## Verificações executadas

- 308 testes locais passaram; incluem contratos, permissões, Cakto/checkout/webhooks existentes, perfil, novas preferências, CSRF/IDOR, reautenticação e prioridades do plano.
- `npm run build`: compilação e TypeScript aprovados.
- `npm run lint`: zero erros, com 94 avisos preexistentes; lint dos arquivos novos/alterados sem novos problemas.
- `node scripts/test-account-settings-sql.mjs`: isolamento, RLS/ACL, exportação sem snapshots protegidos, preservação de nome, exclusão atômica, sessões e bloqueio financeiro; fixtures revertidas por ROLLBACK.
- `node scripts/test-premium-study.mjs`: regressões SQL de acesso pago/gratuito, períodos, preço regular, planejamento, calendário, SRS, simulados, estatísticas e biblioteca; ROLLBACK.
- `ACCOUNT_TEST_ORIGIN=http://127.0.0.1:3000 node --env-file=.env.local scripts/test-account-profiles-http.mjs --settings`: chamadas reais ao servidor local, persistência entre requisições, isolamento entre duas contas, foto, aparência, exportação, encerramento de outras sessões, senha incorreta e exclusão da própria conta temporária.
- Navegador real: dez categorias em 320/390/1280 px, ausência de overflow após corrigir e-mails longos, preferências aplicadas ao dashboard/prática, rascunho preservado durante autosave, tema/contraste/leitura e horários silenciosos.
- Conta gratuita: oito recursos visíveis, modal sem checkout e API Premium 403. Acesso administrativo temporário **somente na fixture**: API 200 e plano gerado com suas metas (20 sessões). Downgrade: API 403, catálogo continua visível e plano preservado.
- Logout pelo novo local e exclusão pelo modal do navegador confirmados. Após excluir, a API de perfil respondeu 401. Na execução final de exclusão, nenhum erro de console.
- Contas temporárias e concessões de teste removidas; ausência conferida. Nenhuma compra, assinatura real, e-mail de teste ou mensagem de suporte foi enviada.

Os scripts de acesso temporário exigem exatamente a conta marcada pelo teste, domínio `.invalid`, ID e marca de fixture conferidos; não expõem operação de concessão na aplicação. A fixture de navegador expira em 15 minutos; uma execução longa expirou e foi repetida com uma nova fixture para confirmar a exclusão pela UI.

## Limitações reais

- Exclusão automática de contas com vínculo financeiro depende de um fluxo de cancelamento/retensão confirmado. A implementação atual conserva a conta e orienta atendimento. Não foi executado cancelamento de assinatura real.
- Google recente/expirado/recuperação foi testado por contratos; não foi feita uma nova autenticação humana no Google para testar essa exclusão de ponta a ponta.
- Avisos exigem suporte/permissão do navegador e a área de estudos aberta. Entrega de notificações pelo sistema operacional não foi exercitada. Não foram criados e-mails agendados, push com a aba fechada ou comunicados automáticos.
- Não foram inventados IA geradora, dicas progressivas, formatos de explicação sem conteúdo estruturado, conquistas ou gamificação. Esses recursos exigem definição/conteúdo/infraestrutura próprios; controles sem efeito não foram adicionados.
- Relatórios e organização reutilizam o que já existe; não há novo construtor livre de dashboards nem planejamento simultâneo de duas instituições.
- Exportações volumosas/truncadas e dados de outros fornecedores continuam dependendo do atendimento. Os registros de pagamento permanecem sujeitos à conferência/retensão, não a uma limpeza indiscriminada.
- O deploy do site não foi executado neste pedido de implementação local.

## Arquivos modificados/criados

- [docs/SETTINGS-AND-PREMIUM.md](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/docs/SETTINGS-AND-PREMIUM.md>)
- [scripts/test-account-profiles-http.mjs](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/scripts/test-account-profiles-http.mjs>)
- [scripts/test-account-settings-sql.mjs](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/scripts/test-account-settings-sql.mjs>)
- [scripts/test-settings-access.mjs](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/scripts/test-settings-access.mjs>)
- [src/app/(informacoes)/privacidade/page.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/(informacoes)/privacidade/page.tsx>)
- [src/app/account-preferences.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/account-preferences.tsx>)
- [src/app/api/account/settings/route.ts](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/api/account/settings/route.ts>)
- [src/app/configuracoes/page.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/configuracoes/page.tsx>)
- [src/app/configuracoes/settings-panel.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/configuracoes/settings-panel.tsx>)
- [src/app/configuracoes/settings.module.css](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/configuracoes/settings.module.css>)
- [src/app/dashboard/dashboard.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/dashboard/dashboard.tsx>)
- [src/app/globals.css](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/globals.css>)
- [src/app/home-theme.module.css](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/home-theme.module.css>)
- [src/app/layout.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/layout.tsx>)
- [src/app/login/account-profile.module.css](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/login/account-profile.module.css>)
- [src/app/login/account-profile.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/login/account-profile.tsx>)
- [src/app/login/login-form.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/login/login-form.tsx>)
- [src/app/premium-gate.module.css](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/premium-gate.module.css>)
- [src/app/premium-gate.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/premium-gate.tsx>)
- [src/app/premium/estudos/page.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/premium/estudos/page.tsx>)
- [src/app/premium/estudos/planning-panels.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/premium/estudos/planning-panels.tsx>)
- [src/app/premium/estudos/workspace.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/premium/estudos/workspace.tsx>)
- [src/app/questoes/practice.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/questoes/practice.tsx>)
- [src/app/simulados/page.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/simulados/page.tsx>)
- [src/app/simulados/simulations.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/simulados/simulations.tsx>)
- [src/app/study-goals.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/study-goals.tsx>)
- [src/app/study-shell.tsx](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/app/study-shell.tsx>)
- [src/lib/account/reminders.ts](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/lib/account/reminders.ts>)
- [src/lib/account/settings-contract.ts](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/lib/account/settings-contract.ts>)
- [src/lib/account/settings-device.ts](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/lib/account/settings-device.ts>)
- [src/lib/auth/legal-documents.ts](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/lib/auth/legal-documents.ts>)
- [src/lib/data/account-settings.ts](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/lib/data/account-settings.ts>)
- [src/lib/data/premium-study.ts](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/lib/data/premium-study.ts>)
- [src/lib/premium-study/planning.ts](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/lib/premium-study/planning.ts>)
- [src/proxy.ts](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/src/proxy.ts>)
- [supabase/migrations/20261024202325_account_preferences_privacy.sql](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/supabase/migrations/20261024202325_account_preferences_privacy.sql>)
- [supabase/migrations/20261024205546_account_notification_preferences.sql](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/supabase/migrations/20261024205546_account_notification_preferences.sql>)
- [supabase/migrations/20261024211822_account_quiz_export.sql](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/supabase/migrations/20261024211822_account_quiz_export.sql>)
- [supabase/tests/test_account_settings.sql](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/supabase/tests/test_account_settings.sql>)
- [tests/account-settings-route.test.mjs](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/tests/account-settings-route.test.mjs>)
- [tests/account-settings.test.mjs](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/tests/account-settings.test.mjs>)
- [tests/login-offer.test.mjs](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/tests/login-offer.test.mjs>)
- [tests/premium-study.test.mjs](<C:/Users/felip/OneDrive/Documentos/cakto/projeto_etec-if/tests/premium-study.test.mjs>)
