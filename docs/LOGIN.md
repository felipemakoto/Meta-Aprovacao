# Etapa 15 — login e logout

Implementada em 28/09/2026 após aprovação do mockup pelo usuário. Checkpoint visual anterior: 4bf2440. Status: implementação e verificações concluídas; aguardando teste real de sair e entrar com a senha do usuário.

## Visual proposto

Adaptação direta da opção 2 do cadastro, já aprovada, preservando cabeçalho, fontes, cores e painel com borda. Tela /login com título Entrar, e-mail, senha, controle de visibilidade e botão Entrar. Links Criar conta e Continuar sem conta. Referência: [login-mobile-v1.png](design/login-mobile-v1.png). Uma proposta derivada do visual escolhido, sem nova exploração de identidade.

## Escopo implementado

- Login com e-mail e senha pelo Supabase Auth, com validação no servidor e sem chave administrativa.
- Mensagem de falha de credenciais sem revelar existência de conta; estados de carregamento, erro operacional e limite de tentativas, sem envio duplicado.
- Sessão persistida em cookies e identidade verificada no servidor; página reconhece sessão já existente em vez de pedir novo login.
- Estado autenticado simples com ação Sair da conta, sem antecipar o dashboard. Logout por POST protegido contra CSRF e encerramento da sessão deste navegador, sem desconectar outros dispositivos por padrão.
- Links entre cadastro e login e acesso à conta a partir do fluxo existente, preservando o quiz público.
- Verificar redirecionamentos, cache de conteúdo autenticado, renovação de sessão, teclado, telas móveis e desktop, login inválido e logout. Login/logout real com a conta do usuário será testado por ele, sem compartilhamento de senha no chat.
- Documentação atualizada e checkpoint Git ao concluir; pausa para teste antes da próxima etapa.

Recuperação de senha permanece na etapa 16; associação do resultado à conta na 17; dashboard em sua etapa própria. Sem publicação de questões ou site, novos provedores de login ou alteração de credenciais/configurações remotas neste checkpoint.

A aprovação visual exigida pelas seções 55–56 do pedido original foi recebida antes do código. Guias locais de Next e documentação oficial de [login](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) e [logout](https://supabase.com/docs/reference/javascript/auth-signout) consultados.

## Implementação e verificação

- /login verifica a identidade com getUser no servidor, exibe formulário ou estado autenticado. Proxy renova sessão; respostas de autenticação são privadas e sem cache. Navegação completa após mutação descarta o cache do roteador.
- POST /api/auth/login e /api/auth/logout validam origem, tipo, query, tamanho do corpo e campos. Logout usa scope local. Login não devolve tokens ou detalhes do erro do provedor. Sem chave administrativa, dependências novas ou mudanças remotas.
- Login limita tentativas conforme resposta do Supabase (429); não há rate limiter adicional da aplicação nesta etapa. Senhas existentes são preservadas literalmente, sem reaplicar regras de força do cadastro.
- 30 testes passaram: login 6, login HTTP 3, cadastro 9, cadastro HTTP 3, base de autenticação 5 e transporte de resultado 4. Lint e build passaram.
- Navegador: 320/390/1280px sem overflow, campos obrigatórios e foco, mostrar/ocultar senha, bloqueio durante envio, falha real com credenciais fictícias, links e retorno público. Sessão existente reconhecida em 127.0.0.1 e preservada após recarga. Console final sem erros/avisos. QA visual em design-qa.md.
- Não foi executado login positivo com a senha do usuário nem logout de sua sessão existente. Renovação após expiração não foi forçada; permanece o mecanismo SSR existente. Estes limites não são apresentados como testes reais concluídos.

## Seu teste

1. Abra http://127.0.0.1:3000/login. Se já estiver conectado, clique em Sair da conta.
2. A tela deve voltar ao formulário Entrar. Recarregue e confirme que continua desconectado.
3. Entre com o e-mail confirmado e a senha criada no cadastro. Não envie a senha pelo chat.
4. Deve aparecer Você está na sua conta. Recarregue e confirme que continua conectado.
5. Volte ao início; o teste gratuito continua acessível. Minha conta leva ao estado da sessão.

Para repetir os testes automatizados no PowerShell, use a pasta do projeto e mantenha npm.cmd run dev aberto em outro terminal:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd run test:login
npm.cmd run test:login:http
```

Manter o mesmo endereço durante o teste: localhost e 127.0.0.1 têm cookies separados. APP_ORIGIN HTTPS continua obrigatório para mutações em produção.
