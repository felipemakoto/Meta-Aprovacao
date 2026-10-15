# Rodapé, início e concordância no cadastro — etapa 59

Pedido do responsável em 15/10/2026: tornar Termos/Privacidade discretos como links de texto, oferecer Suporte somente na página inicial, exigir concordância no cadastro com acesso aos documentos e melhorar o acabamento visual.

## Interface

- Rodapé comum sem cartões, preenchimento, borda ou sombra nos links. Texto de 12px, links Termos de uso/Privacidade, sublinhado no hover e foco de teclado preservado. Conteúdo continua acessível; não foi ocultado com CSS ou removido de leitores de tela.
- Acesso a Suporte somente na página inicial, num bloco compacto com ícone e seta. Removido do rodapé global e o atalho contextual da página de termos. Página `/suporte` e contatos por e-mail continuam disponíveis.
- Início com detalhes do teste, três passos curtos e indicação visual sutil. Sem novas promessas de aprovação, depoimentos ou métricas inventadas.
- Cadastro com cartão claro, hierarquia de campos, vantagens curtas, botão principal, indicação de confirmação por e-mail e bloco de concordância.
- Checkbox desmarcado por padrão. Termos e Política abrem em outra aba e preservam o formulário preenchido. Ausência de concordância mostra mensagem, foca o checkbox e impede envio.

## Servidor e registro

Contrato do cadastro passou a exigir `acceptedLegal:true` e a versão atual `2026-10-15.2`, além dos três campos anteriores. Tipos falsos, versões antigas, timestamp ou metadados arbitrários enviados pelo cliente são recusados antes de chamar o provedor. Origem/CSRF, limite de corpo, respostas neutras, confirmação e recuperação continuam preservados.

O servidor gera a data e os indicadores de concordância com Termos e ciência da Política. O adaptador entrega esse registro ao Supabase em `options.data.legal_acceptance` para novas contas. São metadados de usuário, não um livro de auditoria imutável; não são utilizados para autorizar acesso, planos ou privilégios. Não foi aplicada migration nem atribuída concordância retroativa às contas existentes.

Validação de senha foi separada da concordância para a recuperação continuar funcionando sem exigir novo aceite. Políticas exibem versão, mencionam o registro do cadastro e descrevem a cópia criptografada privada no Google Drive já implementada. A mensagem distingue concordância contratual de ciência da Política e não cria autorização genérica de tratamento. Referência: [LGPD, definição de consentimento e informações sobre tratamento](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm). Não foi criada publicidade, coleta de idade ou declaração de conformidade jurídica integral.

## Conferências

- 21 testes isolados de cadastro, recuperação e leitura segura do corpo passaram.
- Sete testes HTTP de cadastro/recuperação, incluindo recusa de concordância ausente/falsa, sem criar usuários ou enviar e-mail.
- 18 combinações de início, cadastro, login, Termos, Privacidade e Suporte em 320/390/1280px: sem overflow ou erro de navegador. Links do rodapé sem fundo/borda, foco visível e Suporte somente na inicial.
- Formulário no navegador: bloqueio sem checkbox, abertura dos dois documentos em novas abas sem perder campos nem marcar concordância, envio único com checkbox/versão e transição para conferir e-mail. O envio válido foi interceptado; não comprova entrega de e-mail ou persistência real de uma conta nova.
- Lint, TypeScript e build aprovados. Capturas locais em `out/registration59/`, ignoradas pelo Git.

Nada mudou no banco de questões, preços, planos, pagamento ou monitor. Checkout permanece desativado. O registro de metadados será enviado ao provedor quando ocorrer um cadastro real pelo fluxo novo; esse percurso com entrega de e-mail continua pendente.
