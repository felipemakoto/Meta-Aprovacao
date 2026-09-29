# Etapa 16 — recuperação de senha

Implementada em 29/09/2026 após aprovação das duas telas pelo usuário. Checkpoint visual: 7dd8eb2. Status: código e verificações concluídos, aguardando teste real do usuário de recebimento do e-mail, troca da senha e novo login. O agente não enviou e-mails, não alterou credenciais nem configurações remotas.

## Proposta visual

[Prancha com as duas telas](design/recuperacao-senha-v1.png), derivada do login aprovado. São duas telas do mesmo fluxo, não opções alternativas:

1. Recuperar senha: e-mail, Enviar link e Voltar para entrar.
2. Nova senha: nova senha, confirmação, controles de visibilidade e Salvar nova senha.

Manter fontes, cores, painel e ícones existentes. A prancha mostra a composição; a implementação ajustará quebra de título e espaçamentos às larguras móveis, preservando legibilidade e controles acessíveis.

## Escopo implementado

- Adicionar Esqueci minha senha ao login e formulário de solicitação integrado ao Supabase Auth.
- Mensagem neutra após solicitação, sem revelar se o endereço possui conta; tratar falha operacional e limite de envio.
- Validar o link de recuperação no servidor e permitir nova senha apenas no contexto autorizado de recuperação. Uma sessão comum ou parâmetro arbitrário de URL não deve ser suficiente para comprovar recuperação.
- Tratar link inválido, expirado, usado ou aberto sem o contexto necessário; permitir nova solicitação.
- Validar senha e confirmação; proteger mutações contra CSRF, limitar corpo e campos, impedir envio duplicado e manter respostas privadas sem cache.
- Confirmar sucesso, encerrar o contexto de recuperação e orientar novo login. Não registrar senha ou tokens nem utilizar chave administrativa para a troca.
- Consultar documentação atual do Supabase e guias Next instalados antes do código; definir callback e URLs permitidas com base no fluxo implementado.
- Testar validações, erros, acesso indevido, navegação e visual móvel/desktop; deixar o teste real de e-mail e escolha da nova senha para o usuário, sem compartilhar credenciais no chat.

O projeto usa o serviço padrão de e-mail do Supabase; verificar suas restrições atuais antes do teste real. Não configurar SMTP ou publicar o site nesta etapa. Associação do resultado à conta permanece na etapa 17.

A aprovação visual prevista pelas seções 55–56 do pedido original foi recebida antes da implementação.

## Fluxo e segurança

- /recuperar-senha solicita resetPasswordForEmail; /nova-senha verifica recuperação antes de exibir o formulário. /nova-senha/preview é somente desenvolvimento, não envia requisição de atualização e retorna 404 em produção.
- POST /api/auth/recovery e /api/auth/password aceitam campos exatos, JSON até 2048 bytes, origem autorizada e nenhuma query. APP_ORIGIN HTTPS continua obrigatório em produção.
- Callback /auth/confirm já autorizado no projeto é reutilizado. Após exchangeCodeForSession e getUser, getClaims verifica assinatura do JWT. Somente amr.method recovery recente direciona para /nova-senha. Não se confia em type, next ou redirectType fornecidos pelo navegador.
- A API verifica novamente usuário e claims. Exige sub correspondente, role authenticated, session_id, token não expirado e recuperação nos últimos 15 minutos. Cookie de sessão comum não libera atualização. O relógio de recuperação não é reiniciado por refresh de token.
- Senha mantém os limites do cadastro (8 caracteres, até 72 bytes), confirmação exata, sem normalizar senha. updateUser usa cliente de usuário, sem chave administrativa.
- Sucesso solicita signOut local e remove os cookies locais mesmo se a revogação remota falhar. Não promete revogação instantânea de todos os tokens/dispositivos: tokens já emitidos seguem regras e expiração do provedor. O navegador deve fazer novo login.
- Link inválido/expirado/usado ou sem verificador PKCE vai à página de erro compartilhada, agora com Recuperar senha. Link mais recente deve ser aberto no mesmo navegador e host usados na solicitação.
- Sem alteração de templates, SMTP, credenciais ou allowlist. Serviço padrão continua limitado aos destinatários permitidos e sujeito a quota; documentado pelo Supabase como dois e-mails/hora. Sem contornar limites.

## Verificações

41 testes passaram: recuperação 8 + HTTP 3, login 6 + HTTP 3, cadastro 9 + HTTP 3, autenticação base 5 e transporte do resultado 4. Lint e build passaram. Execução isolada de produção confirmou prévia 404, página protegida private/no-store e rejeição de origem HTTP; processo de verificação encerrado.

Navegador: validação de e-mail obrigatório, acesso direto com sessão comum recusado, formulário Nova senha conferido em prévia sem mutação, divergência das senhas e mostrar/ocultar, links de ida e volta, telas 320/390/1280px. Console final sem erros/avisos. Evidências e comparação em design-qa.md.

Ainda não verificados com conta real: entrega de e-mail, troca de código de recuperação, persistência da nova senha e novo login. Testes de sucesso e expiração nos handlers usam dependências simuladas e não substituem esse teste real.

## Teste do usuário

1. Abra http://127.0.0.1:3000/recuperar-senha e informe o e-mail da conta cadastrada (no serviço padrão, use o destinatário permitido do projeto).
2. Clique Enviar link uma vez e confira a caixa de entrada/spam.
3. Abra o link mais recente no mesmo navegador do pedido. Se seu e-mail abrir outro navegador, copie o link para uma aba deste navegador, sem enviá-lo ao chat.
4. A tela Nova senha deve aparecer. Escolha e confirme uma senha diferente da atual e clique Salvar nova senha dentro de 15 minutos.
5. Deve aparecer Senha alterada. Clique Voltar para entrar e teste o login com a nova senha.
6. Confirme que /nova-senha não permite nova troca após o login comum. Se o link estiver inválido, solicite outro respeitando a quota.

Não compartilhar senha ou link de recuperação no chat. A escolha e o envio da nova senha são feitos pelo usuário.

Testes no PowerShell, com servidor dev aberto em outro terminal:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd run test:recovery
npm.cmd run test:recovery:http
```

Fontes consultadas: [recuperação com senha](https://supabase.com/docs/guides/auth/passwords), [resetPasswordForEmail](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [claims JWT](https://supabase.com/docs/guides/auth/jwt-fields), [getClaims](https://supabase.com/docs/reference/javascript/auth-getclaims) e guia cookies do Next instalado.

## Geração

Ferramenta integrada image_gen, referência docs/design/login-mobile-v1.png. Prompt completo em design/recuperacao-senha-prompt.txt. Original gerado preservado fora do repositório; cópia de referência salva no projeto.
