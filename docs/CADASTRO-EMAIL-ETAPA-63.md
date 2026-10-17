# Cadastro por e-mail e retomada dos estudos — etapa 63

Em 17/10/2026, o responsável autorizou um endereço temporário que chega à própria caixa Gmail. O ensaio usou o site publicado, o SMTP configurado e a mensagem realmente recebida. Não houve alteração em conta anterior, envio para alunos, cobrança ou ativação da contratação.

## Resultado

Ensaio completo aprovado às **18:10:34 de São Paulo** (21:10:34 UTC):

1. Cadastro pelo POST público do site, com senha aleatória mantida somente em memória e registro de concordância da conta descartável na versão atual dos documentos.
2. Conta permaneceu não confirmada e a entrada foi recusada antes de usar a mensagem. O site criou o estado PKCE real.
3. Mensagem de confirmação localizada na caixa autorizada. Link limitado ao projeto Supabase correto e retorno fixo do site; nenhum token administrativo ou confirmação manual no banco foi usado.
4. Troca do código pelo próprio callback publicado, sessão autenticada e chegada à página de conta confirmada/planos. Confirmação e metadados conferidos no banco.
5. Saída e nova entrada com a senha; uma resposta de prática foi gravada. Após outra saída/entrada, a mesma resposta continuou no histórico.
6. Código PKCE já consumido recusado, sem autenticar novamente.
7. Conta descartável e dependências removidas por endereço aleatório, instante de criação e marcador exclusivo. Ausência conferida.

O teste foi HTTP, sem navegador visual. Comprova entrega nessa caixa e nesse instante, callback, persistência e nova entrada; não certifica reputação/volume de SMTP, entrega em todos os provedores, caixa de spam ou a retomada de estudos em uma conta Google preexistente. A recuperação positiva de senha já havia sido confirmada pelo responsável em 14/10; não foi reenviada nesta etapa.

## Ferramenta reutilizável

`npm run test:signup:delivery -- --mailbox CAIXA_GMAIL_AUTORIZADA --send-test-email`

O comando exige um terminal interativo, uma caixa explícita e a opção de envio. Cria um alias com identificador aleatório; não reutiliza a conta normal. O link da mensagem deve ser entregue pela entrada do processo, sem ser gravado em arquivo ou colado no chat. Entrada sem eco; senha, cookies, verificador e tokens permanecem em memória. Destinos externos, códigos duplicados, links de recuperação e parâmetros inesperados são recusados antes de consumir um token. Tempo máximo de espera: cinco minutos, seguido de limpeza. Não usar envio automático em heartbeat.

Uma primeira execução enviou a mensagem, mas a entrada do processo havia sido fechada pela ferramenta de terminal, impedindo receber o link. Não foi declarada aprovada. O comando passou a exigir terminal interativo antes de enviar e desativar o eco; a execução seguinte percorreu o fluxo completo. Ao todo, duas mensagens de cadastro de teste foram solicitadas. As mensagens não foram apagadas da caixa.

Três testes isolados dos guardas de endereço, link e callback aprovados; lint dos novos arquivos e conferência do diff aprovados. Execução sem opções/envio recusada antes de criar conta ou enviar mensagem. Nenhum código de aplicação ou migration alterado, portanto não foi repetido o build do site.

## Pendências independentes

Pagamentos continuam dependentes da evidência externa descrita em [etapa 61](PAGAMENTOS-ETAPA-61.md); `checkoutEnabled:false` permanece. O login Google foi publicado e testado pelo responsável, mas uma conta Google antiga com estudos ainda precisa de ensaio específico. Recuperação em outro equipamento e serviços gerenciados em projeto Supabase separado seguem fora da certificação local do backup. Política de retenção financeira detalhada continua pendente; nenhuma exclusão de histórico comercial foi implementada.
