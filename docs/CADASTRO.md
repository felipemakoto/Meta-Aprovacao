# Etapa 14 — cadastro

Implementada em 27/09/2026 com a opção 2 aprovada: painel com borda, três campos e botão Criar conta. Verificação visual e testes automatizados concluídos; teste real de recebimento/confirmação de e-mail pelo usuário ainda pendente.

Retomada em 28/09/2026: servidor reiniciado, aba recarregada após estilos antigos e 12 testes específicos do cadastro novamente aprovados. Evidências finais e checkpoint registrados; aplicação pronta para o teste acima, sem criação automática de conta.

## Fluxo

O resumo do quiz oferece Criar conta, sem bloquear a revisão. /cadastro recebe e-mail, senha e confirmação, permite mostrar/ocultar senhas, valida campos e impede envio duplicado no formulário. Labels, erros associados, foco no primeiro campo inválido e teclado conferidos. O link Continuar sem conta volta à entrada.

POST /api/auth/signup aceita somente esses três campos, JSON de até 2048 bytes, origem confiável e nenhuma query. E-mail até 254 caracteres; senha com mínimo de oito caracteres e máximo de 72 bytes (limite conservador de compatibilidade com bcrypt); senha não é cortada nem normalizada. Política adicional do provedor também é respeitada. Cliente Supabase de usuário, sem service_role. Nunca retorna e-mail, identidade, senha ou tokens. Conta existente recebe mensagem neutra, erros operacionais não expõem mensagens do provedor. Sessão ativa não é substituída por cadastro.

Supabase SSR usa PKCE. O link padrão confirma o e-mail no Supabase e retorna um code para /auth/confirm; o servidor troca o código pelo cookie de sessão e verifica o usuário. O destino é fixo, sem next/redirect_to arbitrário. A URL final remove o código. /cadastro/confirmado só afirma confirmação após getUser validar uma conta com email_confirmed_at. Acesso direto sem sessão mostra confirmação pendente. Link inválido, vencido ou sem o cookie do navegador leva a /cadastro/confirmacao-invalida.

O servidor preserva localhost ou 127.0.0.1 no retorno local, pois Next normaliza esses hosts internamente e trocar o endereço perderia o cookie. Produção exige APP_ORIGIN com origem HTTPS explícita; não aceita origem derivada de cabeçalhos arbitrários. Respostas Auth usam private/no-store; HTML dinâmico de confirmação conferido também no build de produção. O Proxy renova sessão na confirmação, além das rotas /api/auth já existentes.

## Configuração remota conferida

Projeto clxnqrkdalimrqcnhegr: cadastro por e-mail habilitado, confirmação obrigatória (mailer_autoconfirm=false), SMTP personalizado desabilitado. Site URL existente http://localhost:3000 preservada. Adicionadas apenas duas URLs exatas de retorno na lista permitida:

- http://127.0.0.1:3000/auth/confirm
- http://localhost:3000/auth/confirm

Evidência em [cadastro-urls.png](design/cadastro-urls.png). Nenhuma configuração de confirmação foi desabilitada, nenhum usuário foi criado por automação, nenhum e-mail enviado, nenhuma questão publicada e nenhuma migration aplicada.

O serviço padrão do Supabase só entrega e-mails aos endereços da equipe do projeto e tem limite baixo (documentação consultada: dois por hora). Para teste, use o e-mail da sua conta Supabase. Antes de abrir para outros alunos, configurar SMTP próprio, origem HTTPS, URLs finais e proteção contra abuso/limitação de requisições. Não ampliar a equipe como solução para entregar e-mails a alunos. Modelos padrão de e-mail permanecem ativos; podem estar em inglês. Essas limitações não são contornadas pelo formulário.

## Teste do usuário

1. Abra http://127.0.0.1:3000/cadastro com o servidor local ativo.
2. Use o e-mail da sua conta Supabase e escolha uma senha própria para este aplicativo.
3. Clique Criar conta. Deve aparecer Confira seu e-mail, com mensagem neutra sobre o envio.
4. Confira a caixa de entrada/spam. Abra o link no mesmo navegador em que se cadastrou (se necessário, copie o endereço do link do e-mail para esse navegador, sem compartilhá-lo no chat).
5. Esperado: E-mail confirmado. Voltar ao início mantém o acesso ao quiz.

Se aparecer limite de envios, aguarde; reenviar repetidamente não ajuda. Se o link expirar, envie novamente o formulário após aguardar e use o e-mail mais recente. Se trocar navegador, limpar cookies ou alternar localhost/127.0.0.1, a troca PKCE pode falhar. Login/logout serão a etapa 15; não anunciar esse fluxo como implementado. Associação da tentativa permanece na etapa 17.

## Verificações

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npm.cmd run test:signup
npm.cmd run test:signup:http
npm.cmd run test:auth
npm.cmd run test:result
npm.cmd run lint
npm.cmd run build
```

Nove testes unitários de cadastro/callback, três HTTP negativos sem envio, cinco de autenticação base e quatro de transporte do resultado passaram (21). Build e lint passaram. Produção verificada isoladamente na porta 3001: confirmação sem sessão permanece pendente e não usa cache compartilhado; cadastro sem APP_ORIGIN HTTPS é recusado. Servidor temporário encerrado; desenvolvimento permanece na porta 3000. Primeira rodada HTTP falhou porque o servidor estava parado; após iniciar, os testes revelaram a normalização do host, corrigida e coberta por regressão. Next dev substitui Cache-Control de HTML por no-cache/must-revalidate; produção confirmou private/no-store.

Navegador: comparação com opção 2, ajustes no tamanho do título e densidade do formulário, 320/390/1280 sem overflow, validação vazia e de entradas sintéticas inválidas, mostrar senha, retorno à entrada, callback inválido e acesso pelo resultado. Console sem erros/avisos capturados. Não foram provocados envio real, expiração real de link, indisponibilidade de rede ou sucesso real de cadastro no navegador. Testes positivos unitários usam dependências simuladas e não comprovam entrega do e-mail.

## Referências

- [Cadastro e senhas no Supabase](https://supabase.com/docs/guides/auth/passwords)
- [signUp e comportamento para contas existentes](https://supabase.com/docs/reference/javascript/auth-signup)
- [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Restrições do SMTP padrão](https://supabase.com/docs/guides/auth/auth-smtp)
- Guias Next instalados: Route Handlers, cookies e Server/Client Components.

Nenhuma dependência adicionada. Dois ícones Heroicons v2.2.0 oficiais baixados; licença existente preservada. Sem credenciais versionadas.
