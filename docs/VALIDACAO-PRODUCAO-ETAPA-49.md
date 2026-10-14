# Validação da publicação e preparação para testes Cakto — etapa 49

Conferência de 14/10/2026. Site: https://meta-aprovacao.vercel.app. A contratação continua desativada. Nenhuma compra, cobrança ou concessão de Premium foi realizada.

## Fluxo de estudo na publicação

O comando `npm run test:production:study` usa uma conta descartável confirmada pela API administrativa, sem enviar e-mail, e entra pelo endpoint de login real do site. Não usa sessão do responsável. Senha, cookies, respostas, gabaritos e dados da conta não são impressos. O projeto Supabase do ambiente precisa corresponder ao projeto ligado à CLI antes de criar a fixture.

Dez grupos de verificações integradas passaram contra a publicação existente. O comando foi conferido novamente após incluir a guarda que compara o projeto ligado à CLI; última conclusão em **14/10/2026 às 22:56:14 UTC**, com todos os grupos aprovados e fixture removida:

1. Entrada/login públicos e acesso anônimo negado à área privada.
2. Login com senha e sessão reconhecida pelo servidor.
3. Dashboard, questões, simulados, histórico e estatísticas acessíveis com a conta confirmada.
4. Página Premium com contratação indisponível; POST autenticado de checkout recebe 503, sem redirecionar para pagamento.
5. Conta gratuita começa com dez práticas e um simulado disponíveis, sem Premium.
6. Uma prática recebe questão publicada sem gabarito antecipado. Repetir a requisição mantém a mesma tentativa. Resposta e explicação conferidas com o catálogo; envio repetido é idempotente.
7. Catálogo gratuito contém só o rápido. Os cinco IDs reais dos modelos Premium são negados pela API, sem criar tentativa.
8. Rápido entrega dez questões únicas, duas de cada matéria, sem gabarito antecipado. Retomada preserva a tentativa; correção e repetição conferidas. Novo rápido após conclusão recebe o limite diário.
9. Histórico contém uma prática e um simulado; estatísticas contam onze respostas, um simulado e o número correto de acertos. Cotas consumidas uma única vez: prática 1/10 e simulado 1/1.
10. Logout encerra o acesso pelo navegador; status passa a não autenticado.

A conta é marcada com um identificador aleatório. A limpeza remove somente a fixture com e-mail aleatório e marcador coincidentes, seguida de conferência de ausência de conta, práticas, requisições, simulados, intenções e assinaturas vinculados. Nenhuma conta ou histórico preexistente foi removido. O teste terminou com `fixtureRemoved:true`.

Essa evidência não testa cadastro com entrega de e-mail, recuperação de senha, navegadores/dispositivos variados, calibração das questões ou um comprador Premium real. Não modifica permissões, limites, modelos ou conteúdo. Nenhuma alteração de código da aplicação foi necessária nesta etapa.

ESLint do novo script aprovado. O build da aplicação não foi repetido porque somente script administrativo, comando de execução e documentação foram adicionados; o código de Next.js, schema e a função de automação permanecem os da etapa 48.

## Oferta e checkout da Cakto, sem compra

Consulta autenticada somente de leitura confirmou a oferta configurada: ativa, assinatura de R$22,99, recorrência de trinta dias e renovações até cancelamento.

O checkout público foi aberto em dois contextos novos e isolados de navegador automatizado, regular e com `?coupon=primeiracompra`. Ambos responderam HTTP 200. Nenhum formulário foi preenchido nem botão de pagamento acionado.

- Regular: produto R$22,99, taxa R$0,99 e total R$23,98.
- Com cupom: produto R$11,50, desconto R$11,49, taxa R$0,99 e total R$12,49. A página identifica a primeira cobrança com desconto e as seguintes por R$23,98/mês.

Essa observação corresponde ao método **Pix Automático** exibido por padrão. Não comprova o resultado de uma cobrança, todos os métodos disponíveis, o fuso de validade do cupom ou o contrato de moeda da API de pedidos. A configuração de expiração informada pelo responsável é 31/10/2026, ainda sem confirmação independente do horário do provedor.

## Próximo acesso externo necessário

O responsável informou que ainda não tem staging. A [documentação oficial de ambientes](https://docs.cakto.com.br/conceitos/ambientes), consultada nesta etapa, informa que existe staging com credenciais próprias, mas sua URL precisa ser obtida com o suporte. Não há confirmação ali de checkout hospedado de staging. Nenhuma URL foi adivinhada, credencial de produção reutilizada em outro host ou integração de produção trocada.

A [consulta oficial de pedido](https://docs.cakto.com.br/api-reference/orders/retrieve) continua sem `currency` no contrato publicado consultado. O verificador permanece exigindo evidência explícita; a moeda não foi inferida do domínio, checkout ou idioma. Pedido real detalhado e condições de staging ainda dependem da Cakto.

[Mensagem pronta para o suporte](SOLICITACAO-TESTES-CAKTO.md), sem envio automático, reúne o acesso de teste, ausência de movimentação financeira, moeda/valores, primeira cobrança e fuso do cupom. Enquanto essas condições não forem confirmadas, o próximo teste de pagamento do provedor não pode ser apresentado como concluído.
