# Etapa 16 — recuperação de senha

Iniciada em 29/09/2026, após conclusão da etapa 15 no checkpoint b6ecd7b. Status: proposta visual aguardando aprovação. Nenhuma implementação, envio de e-mail, troca de senha ou alteração remota nesta fase.

## Proposta visual

[Prancha com as duas telas](design/recuperacao-senha-v1.png), derivada do login aprovado. São duas telas do mesmo fluxo, não opções alternativas:

1. Recuperar senha: e-mail, Enviar link e Voltar para entrar.
2. Nova senha: nova senha, confirmação, controles de visibilidade e Salvar nova senha.

Manter fontes, cores, painel e ícones existentes. A prancha mostra a composição; a implementação ajustará quebra de título e espaçamentos às larguras móveis, preservando legibilidade e controles acessíveis.

## Escopo após aprovação

- Adicionar Esqueci minha senha ao login e formulário de solicitação integrado ao Supabase Auth.
- Mensagem neutra após solicitação, sem revelar se o endereço possui conta; tratar falha operacional e limite de envio.
- Validar o link de recuperação no servidor e permitir nova senha apenas no contexto autorizado de recuperação. Uma sessão comum ou parâmetro arbitrário de URL não deve ser suficiente para comprovar recuperação.
- Tratar link inválido, expirado, usado ou aberto sem o contexto necessário; permitir nova solicitação.
- Validar senha e confirmação; proteger mutações contra CSRF, limitar corpo e campos, impedir envio duplicado e manter respostas privadas sem cache.
- Confirmar sucesso, encerrar o contexto de recuperação e orientar novo login. Não registrar senha ou tokens nem utilizar chave administrativa para a troca.
- Consultar documentação atual do Supabase e guias Next instalados antes do código; definir callback e URLs permitidas com base no fluxo implementado.
- Testar validações, erros, acesso indevido, navegação e visual móvel/desktop; deixar o teste real de e-mail e escolha da nova senha para o usuário, sem compartilhar credenciais no chat.

O projeto usa o serviço padrão de e-mail do Supabase; verificar suas restrições atuais antes do teste real. Não configurar SMTP ou publicar o site nesta etapa. Associação do resultado à conta permanece na etapa 17.

A pausa visual segue as seções 55–56 do pedido original: apresentar o mockup, parar e aguardar aprovação antes da implementação.

## Geração

Ferramenta integrada image_gen, referência docs/design/login-mobile-v1.png. Prompt completo em design/recuperacao-senha-prompt.txt. Original gerado preservado fora do repositório; cópia de referência salva no projeto.
