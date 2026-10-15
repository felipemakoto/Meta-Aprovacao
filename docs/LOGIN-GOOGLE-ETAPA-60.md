# Preparação do login Google — etapa 60

Pedido de 15/10/2026: retirar “Confirme o e-mail para começar a estudar” e integrar a criação de conta com Google/Gmail. O responsável confirmou que ainda não criou um cliente OAuth.

## Entregue

- Frase e estilos correspondentes removidos. Cadastro por e-mail, confirmação real e recuperação de senha preservados.
- Componente **Continuar com Google** no cadastro e na entrada de visitantes, com marca local oficial e tamanho adequado ao celular.
- Disponibilidade consultada em `/api/auth/google/status`. O botão só aparece quando o projeto Supabase informa Google habilitado; enquanto desativado, não há botão que anuncia uma entrada indisponível.
- Antes de iniciar, diálogo acessível exige concordância explícita. Links dos documentos abrem em outra aba; fechar/Escape cancela a espera e impede redirecionamento tardio. Não é necessário preencher os campos de e-mail/senha para escolher Google.
- POST `/api/auth/google` exige origem confiável, corpo limitado, booleano verdadeiro e versão atual dos documentos. Não substitui uma sessão já autenticada.
- PKCE gerado pela biblioteca Supabase SSR, retorno fixo `/auth/google/callback`, URL autorizada restrita ao projeto/provedor/retorno e método de desafio esperado. Sem `next` ou redirecionamento livre.
- Concordância temporária em cookie HttpOnly/Secure/SameSite Lax, escopo `/auth/google`, dez minutos, assinatura HMAC com contexto próprio. Usa segredo já existente somente no servidor; nenhuma chave Google ou de serviço vai ao cliente.
- No retorno, o provedor valida PKCE; o servidor verifica usuário confirmado, identidade Google e claims de método OAuth. Sessão de recuperação não serve como login Google.
- Cookies de autenticação ficam em memória até a identidade e o registro `legal_acceptance` terem sucesso. Falhas não publicam a nova sessão; eventual saída limita-se à sessão local recém-criada. Não são encerradas sessões de outros dispositivos.
- Cookie de concordância é apagado no retorno e o destino não preserva código ou erro do provedor. Cancelamento/falha oferece página própria de nova tentativa.
- Escopos limitados a `openid email profile`. Não pede leitura de Gmail, Drive ou contatos; a senha Google é digitada no Google. Metadados de concordância continuam informativos, não autorização de privilégios ou auditoria imutável.
- Política descreve os dados básicos de Google, com versão conjunta dos documentos atualizada para `2026-10-15.3`. Não houve aceite retroativo nas contas existentes.

## Estado externo real

Consulta somente de leitura em `/auth/v1/settings` retornou **Google desativado**. Não havia credenciais Google OAuth configuradas no ambiente local. Não foi criado projeto/cliente no Google Cloud, alterado provedor no Supabase ou contratada ferramenta. Nenhum login Google real foi certificado.

O [roteiro de configuração](CONFIGURAR-GOOGLE.md) traz as origens, o retorno do Google para Supabase e os retornos do Supabase para o site. ID/segredo são informados diretamente no painel do Supabase pelo responsável. Depois de salvar e recarregar o site, o botão passa a aparecer sem alteração de código ou nova publicação. Ainda será necessário validar entrada real, consentimento, retorno, conta existente e retomada de estudos.

## Validação

- Nove testes Google: origem/CSRF, aceite, limites, provedor desligado, sessão existente, PKCE real gerado offline pela biblioteca, URL adulterada, cookie alterado/vencido/origem/chave, retorno seguro e identidade/método.
- Adaptador exercitado com serviços controlados: cookies só são publicados após registro e identidade aprovados; falha de troca, identidade ou atualização não os publica. Esses dois testes integram os nove acima.
- 26 regressões de cadastro, recuperação e ações da conta, mais dois testes do prazo/limites de corpos de autenticação, incluindo o novo POST. Total: **37 testes isolados**.
- Três testes HTTP Google e sete regressões HTTP de cadastro/recuperação; nenhuma conta ou e-mail criado.
- Doze combinações de telas/larguras em 320/390/1280px: botão ausente com provedor desligado, entrada/cadastro com disponibilidade simulada e página de erro. Documentos preservam diálogo, aceite é obrigatório, Escape funciona e não houve overflow/erro de navegador.
- Falha de início permite usar o formulário normal; redirecionamento simulado funciona. Ensaio adicional confirmou que cancelar durante a requisição impede navegação tardia e reabilita o formulário.
- Lint sem avisos novos, TypeScript e build aprovados. Capturas em `out/google60/`, ignoradas pelo Git.

Não foram enviados tokens ou credenciais reais a serviços de teste. Interceptações de navegador e serviços controlados não equivalem a uma autenticação real pelo Google. Conteúdo, pagamentos, limites e monitor permanecem preservados; checkout segue desativado.

Referências: [Google no Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [claims e método OAuth](https://supabase.com/docs/guides/auth/jwt-fields), [marca Google](https://developers.google.com/identity/branding-guidelines). O ícone segue a origem oficial registrada separadamente em `public/icons/GOOGLE-BRANDING.txt`, sem atribuir-lhe a licença MIT dos outros ícones.
