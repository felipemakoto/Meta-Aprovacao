# Etapa 15 — login e logout

Iniciada em 28/09/2026, após confirmação real do cadastro na etapa 14 (checkpoint cead1fe). Status: proposta visual, aguardando aprovação antes de implementar. Nenhum fluxo de login/logout foi adicionado neste checkpoint.

## Visual proposto

Adaptação direta da opção 2 do cadastro, já aprovada, preservando cabeçalho, fontes, cores e painel com borda. Tela /login com título Entrar, e-mail, senha, controle de visibilidade e botão Entrar. Links Criar conta e Continuar sem conta. Referência: [login-mobile-v1.png](design/login-mobile-v1.png). Uma proposta derivada do visual escolhido, sem nova exploração de identidade.

## Escopo após aprovação

- Login com e-mail e senha pelo Supabase Auth, com validação no servidor e sem chave administrativa.
- Mensagem de falha de credenciais sem revelar existência de conta; estados de carregamento, erro operacional e limite de tentativas, sem envio duplicado.
- Sessão persistida em cookies e identidade verificada no servidor; página reconhece sessão já existente em vez de pedir novo login.
- Estado autenticado simples com ação Sair da conta, sem antecipar o dashboard. Logout por POST protegido contra CSRF e encerramento da sessão deste navegador, sem desconectar outros dispositivos por padrão.
- Links entre cadastro e login e acesso à conta a partir do fluxo existente, preservando o quiz público.
- Verificar redirecionamentos, cache de conteúdo autenticado, renovação de sessão, teclado, telas móveis e desktop, login inválido e logout. Login/logout real com a conta do usuário será testado por ele, sem compartilhamento de senha no chat.
- Documentação atualizada e checkpoint Git ao concluir; pausa para teste antes da próxima etapa.

Recuperação de senha permanece na etapa 16; associação do resultado à conta na 17; dashboard em sua etapa própria. Sem publicação de questões ou site, novos provedores de login ou alteração de credenciais/configurações remotas neste checkpoint.

A pausa para aprovação segue as seções 55–56 do pedido original: apresentar o mockup, parar e aguardar aprovação antes de implementar a interface. Antes do código, consultar guias Next instalados e documentação oficial atual do Supabase.
