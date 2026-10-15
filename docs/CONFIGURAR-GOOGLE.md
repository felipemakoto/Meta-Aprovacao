# Ativar entrada com Google

O código do botão e do retorno está preparado. Falta criar o cliente no Google Cloud e habilitá-lo no Supabase. Não é a senha do Gmail nem a senha de app usada no SMTP.

## 1. Projeto e aplicativo

Abra a [Google Auth Platform](https://console.cloud.google.com/auth/overview), selecione ou crie um projeto para **Meta Aprovação** e inicie a configuração do aplicativo.

- Nome: **Meta Aprovação**.
- Público: **Externo**, para aceitar contas Google de fora de uma organização.
- Preencha os contatos com os e-mails que você deseja usar para esse fim. O contato público autorizado da plataforma é `metaaprovacao720@gmail.com`; não escolha um endereço pessoal como suporte público se não quiser exibi-lo. Se o endereço não aparecer entre as opções do Google, confira a conta/projeto antes de continuar.
- Página inicial: `https://meta-aprovacao.vercel.app`.
- Privacidade: `https://meta-aprovacao.vercel.app/privacidade`.
- Termos: `https://meta-aprovacao.vercel.app/termos`.

Se o aplicativo estiver em **teste**, adicione a conta Google que você usará para testar à lista de usuários de teste. Não trate essa configuração como disponível para todos os alunos.

## 2. Acesso aos dados

Mantenha somente os dados básicos de identificação necessários: `openid`, e-mail e perfil. A aplicação não pede acesso à caixa de e-mails, Google Drive, calendário ou contatos. Não é necessário habilitar a API Gmail para entrar com Google.

## 3. Criar o cliente

Em **Clientes**, crie um **ID do cliente OAuth** do tipo **Aplicativo da Web**.

Nome sugerido: **Meta Aprovação Web**.

Em **Origens JavaScript autorizadas**:

```text
https://meta-aprovacao.vercel.app
http://127.0.0.1:3000
http://localhost:3000
```

As duas origens locais servem para desenvolvimento. Em **URIs de redirecionamento autorizados**, adicione o retorno do projeto Supabase:

```text
https://clxnqrkdalimrqcnhegr.supabase.co/auth/v1/callback
```

Crie o cliente e guarde o ID e o segredo em local seguro. Não envie o segredo pelo chat e não coloque em variável `NEXT_PUBLIC_*`.

## 4. Habilitar no Supabase

Abra [Authentication → Sign In / Providers](https://supabase.com/dashboard/project/clxnqrkdalimrqcnhegr/auth/providers), escolha **Google**, habilite o provedor e preencha o ID e o segredo do cliente criados no Google Cloud. Salve.

O segredo fica no provedor gerenciado pelo Supabase; não é necessário colocá-lo na Vercel ou no código do botão.

Em [Authentication → URL Configuration](https://supabase.com/dashboard/project/clxnqrkdalimrqcnhegr/auth/url-configuration), mantenha a Site URL e todos os retornos já usados por cadastro/recuperação. **Acrescente**, sem substituir os anteriores:

```text
https://meta-aprovacao.vercel.app/auth/google/callback
http://127.0.0.1:3000/auth/google/callback
http://localhost:3000/auth/google/callback
```

O endereço do passo 3 é o retorno **do Google para o Supabase**. Os endereços deste passo são o retorno **do Supabase para o site**. Eles têm funções diferentes.

## 5. Conferir

Recarregue o cadastro ou a página de entrada. O botão **Continuar com Google** aparece quando o Supabase informa que o provedor está habilitado; não depende de publicar novamente o site.

Abra o botão, confirme os documentos e entre no Google pelo seu próprio navegador. Ao voltar, o site verifica a identidade, registra a concordância e abre a escolha de planos. Confirme que a conta reaparece na entrada e que os estudos continuam vinculados a ela. Não foi automatizada a digitação de senha ou confirmação da conta Google.

Se cancelar ou se o retorno expirar, a página oferece outra tentativa. O cadastro por e-mail permanece disponível. Ativar o provedor não comprova, por si só, que o fluxo real inteiro foi validado.

Antes de disponibilizar a todos, confira o público e o estado de publicação/verificação do aplicativo no Google. Não foi presumida aprovação da marca ou da aplicação pelo Google, nem criado domínio próprio.

Referências: [configuração Google no Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [SSR e clientes](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [marca e botão Google](https://developers.google.com/identity/branding-guidelines).
