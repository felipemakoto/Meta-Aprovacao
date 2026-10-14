# Envio inicial com Gmail, sem domínio próprio

Roteiro preparado em 14/10/2026. Nenhum SMTP foi configurado pelo agente e nenhuma senha foi criada ou salva no projeto. Esta opção permite preparar o teste com uma conta Gmail escolhida pelo responsável, se a conta permitir senha de app. Não comprova entrega nem dimensionamento para o lançamento.

## 1. Preparar a conta Google

Ative a [verificação em duas etapas](https://myaccount.google.com/security) na conta Gmail que enviará os e-mails. Depois abra [Senhas de app](https://myaccount.google.com/apppasswords) e crie uma senha específica para `Meta Aprovação - Supabase`.

Não é a senha normal do Gmail. Cole a senha de app somente na configuração SMTP do Supabase, sem enviá-la no chat, commitá-la ou colocá-la no código. Se a opção não aparecer, verifique as restrições descritas pelo [Google](https://support.google.com/accounts/answer/185833?hl=pt-BR); não desative proteções da conta para contornar a restrição.

## 2. Preencher SMTP no Supabase

No projeto `clxnqrkdalimrqcnhegr`, procure **Authentication → Email/SMTP Settings** e ative SMTP personalizado. Use a conta que você escolheu:

| Campo | Valor |
| --- | --- |
| Sender name / Nome do remetente | Meta Aprovação |
| Sender email / E-mail do remetente | Endereço completo da conta Gmail escolhida |
| Host | `smtp.gmail.com` |
| Port / Porta | `587` (TLS/STARTTLS) |
| Username / Usuário | O mesmo endereço Gmail completo |
| Password / Senha | Senha de app criada no Google |

O Supabase documenta também a porta 465 para esse host. Não trocar a porta por tentativa indiscriminada nem usar `smtp-relay.gmail.com`, que envolve configuração diferente. Preserve confirmação obrigatória, origem pública e URLs de retorno existentes.

## 3. Conferir a entrega

Após salvar, fazer uma solicitação real controlada no site e conferir a caixa de entrada/spam. Abrir o link no mesmo navegador e endereço usados para solicitá-lo. Conferir cadastro confirmado e recuperação com nova senha escolhida pelo responsável, incluindo um login posterior. Os ensaios administrativos com tokens da etapa 50 não substituem essa conferência.

Não fazer solicitações repetidas caso apareça limite de envio. O Gmail e o Supabase têm limites próprios; este roteiro não garante volume, entrega ou gratuidade de qualquer mudança futura. Antes de ampliar a operação, avaliar um serviço transacional e remetente/domínio próprios.

O Gmail conectado ao chat não disponibiliza uma senha SMTP para o Supabase. A etapa de criar a senha de app permanece na Conta Google do responsável.

Fontes oficiais consultadas: [SMTP Google com Supabase](https://supabase.com/docs/guides/troubleshooting/using-google-smtp-with-supabase-custom-smtp-ZZzU4Y), [senhas de app](https://support.google.com/accounts/answer/185833?hl=pt-BR), [servidor SMTP do Gmail](https://support.google.com/mail/answer/7104828?hl=pt-BR) e [SMTP no Supabase](https://supabase.com/docs/guides/auth/auth-smtp).
