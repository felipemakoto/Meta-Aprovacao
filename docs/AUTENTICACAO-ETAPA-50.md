# Autenticação e uso móvel — etapa 50

## Atualização em 17/10/2026

Pendência de cadastro novo por e-mail encerrada por ensaio com mensagem realmente recebida na caixa autorizada: cadastro público, confirmação PKCE, planos autenticados e resposta preservada após sair/entrar aprovados. Código consumido recusado; conta descartável removida e ausência conferida. Detalhes e limites em [etapa 63](CADASTRO-EMAIL-ETAPA-63.md). Os registros abaixo são históricos.

## Atualização após teste real do responsável — 14/10/2026

O responsável configurou o SMTP Gmail diretamente no Supabase e confirmou nesta conversa: **o e-mail chegou, ele salvou uma nova senha e entrou usando essa nova senha**. A pendência de entrega e recuperação positiva do site foi encerrada com base nesse teste humano. O agente não recebeu senha de app, senha da conta, token ou link de recuperação e não executou a troca. Isso não transforma os ensaios administrativos abaixo em testes de entrega nem certifica volume de envio ou um novo cadastro por e-mail. O responsável continua sem domínio próprio.

Os registros seguintes descrevem a situação e os testes anteriores à configuração feita pelo responsável.

Conferência em 14/10/2026. Sem compra, mudança de senha de contas preexistentes, envio de e-mails de autenticação ou alteração do provedor/SMTP. Contratação permanece desativada e conteúdo publicado preservado.

## Correção aplicada

Os handlers de cadastro, login/logout e solicitação/alteração de senha limitavam bytes, mas aguardavam sem prazo um corpo que parasse de chegar. O cancelamento do stream também era aguardado sem prazo. Agora compartilham `readAuthJson`: cinco segundos para o corpo inteiro, HTTP 408 com código fixo se o envio não terminar, sem esperar um cancelamento que não resolva. Limites anteriores mantidos: 2048 bytes para cadastro/recuperação e 4096 para login/logout. UTF-8 inválido, JSON inválido, stream interrompido e excesso de bytes são recusados antes de autenticar, enviar e-mail ou mudar senha.

Os formulários mostram uma mensagem específica de demora e orientam conferir a conexão. Não há repetição automática de cadastro/recuperação. Origem permitida, CSRF, campos exatos, confirmação obrigatória, cookies e contexto de recuperação permanecem protegidos.

## Verificações

- 26 testes Node aprovados: 24 existentes e dois testes novos cobrindo os cinco handlers com corpo parado, cancelamento pendente, excesso de bytes, codificação inválida e erro de stream. Provedor nunca chamado nesses casos.
- 14 testes HTTP contra o domínio publicado aprovados: páginas, métodos, CSRF, payloads inválidos, cookie corrompido/forjado, callback externo recusado e atualização sem recuperação negada. Um teste antigo procurava uma frase já removida do login; foi corrigido para conferir os campos reais de e-mail/senha e o link de recuperação, sem modificar o conteúdo da página para satisfazer o teste.
- Build/TypeScript e lint aprovados. Os testes HTTP iniciais conferem a publicação existente; os novos casos de timeout foram exercitados nos handlers locais reais, sem simular uma conexão lenta contra a produção.
- Navegador automatizado isolado: seis páginas públicas de autenticação em 320, 390, 768 e 1280 px, total de 24 combinações, sem rolagem horizontal nem erro de execução. Cadastro inválido mantém foco e erros, mostrar/ocultar senha funciona e recuperação vazia não envia requisição. Nenhum POST de autenticação nesses ensaios. Quatro capturas de 320 px em `out/auth-mobile50/`; inspeção visual do cadastro, login e recuperação concluída.
- Build local em produção, porta temporária 3001: as três telas exibiram a mensagem de demora após resposta 408 interceptada no navegador, liberaram nova tentativa e mantiveram o layout em 320 px. Nenhuma requisição real de autenticação foi enviada. O teste inicialmente encontrou o alerta vazio do anunciador de rotas do Next; o seletor foi corrigido para identificar o alerta do formulário. Servidor temporário encerrado.

## Teste com tokens reais, sem entregar e-mails

`npm run test:production:auth` cria somente uma conta descartável marcada, usando a API administrativa `generateLink`. Senhas, tokens, links de ação, cookies e respostas do provedor ficam em memória e não são impressos. A guarda inicial compara o projeto Supabase com a CLI ligada. Limpeza por e-mail e marcador aleatórios, com conferência de ausência da fixture e dependências.

Sete grupos passaram, com conclusão em 14/10/2026 às 23:31:14 UTC (20:31:14 em São Paulo): cadastro por e-mail habilitado e confirmação exigida; conta não confirmada recusada no login; token de confirmação verificado pelo provedor e página de confirmação autenticada; token consumido não reutilizável; sessão comum sem direito a reset; sessão implícita sem contexto PKCE recusada e senha da fixture preservada; token administrativo de recuperação também não reutilizável.

**Esse teste não comprova entrega de e-mail nem troca positiva de senha pelo fluxo PKCE do site.** A primeira tentativa esperava obter recuperação autorizada de um link administrativo. A sessão real retornou AMR `otp`, não `recovery`, e o site a recusou. Duas variantes e a consulta sanitizada de métodos confirmaram a diferença; todas as fixtures foram removidas. A expectativa foi corrigida para testar a recusa e preservação da senha, sem afrouxar a aplicação para aceitar OTP comum.

O código oficial do Supabase distingue a criação do estado PKCE de recuperação na [rota recover](https://github.com/supabase/auth/blob/master/internal/api/recover.go) e usa o método desse estado ao [trocar o código PKCE](https://github.com/supabase/auth/blob/master/internal/api/token.go). Links administrativos são gerados por [outro caminho](https://github.com/supabase/auth/blob/master/internal/api/mail.go). Não se deve transformar um token administrativo/fluxo implícito em evidência de que o callback PKCE e a caixa de entrada funcionaram.

## Pendência de entrega no momento do ensaio automatizado — resolvida pelo teste acima

O responsável confirmou que **ainda não configurou SMTP e não possui domínio próprio**. As configurações públicas do Auth confirmam cadastro habilitado e confirmação obrigatória, mas não informam o SMTP personalizado; a ausência foi informada pelo responsável.

Segundo a [documentação atual do Supabase](https://supabase.com/docs/guides/auth/auth-smtp), o envio padrão é restrito aos destinatários da equipe do projeto e não se destina a produção. Se ainda estiver em uso, será necessário configurar um remetente próprio antes de oferecer cadastro por e-mail a novos alunos. Não foi desabilitada a confirmação, criado remetente, contratado serviço ou solicitado segredo pelo chat. A prova final de chegada do e-mail, abertura no mesmo navegador e troca de senha continua pendente.

Preparado [roteiro inicial com Gmail](SMTP-INICIAL-GMAIL.md), baseado nas configurações oficiais Google/Supabase, sem comprar domínio ou preencher credenciais automaticamente. Exige verificação em duas etapas e senha de app disponível na conta escolhida. Nome do remetente, host, porta e campos necessários estão discriminados; o segredo deve ser colocado diretamente no Supabase pelo responsável. O Gmail conectado ao chat não fornece essa senha SMTP. Nenhuma conta foi criada ou proteção do Google alterada.

A solicitação ao suporte Cakto foi enviada em 14/10/2026, após autorização do responsável, conforme histórico desta conversa. Nenhum novo contato ou acompanhamento automático foi realizado nesta etapa.
