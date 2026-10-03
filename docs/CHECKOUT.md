# Etapa 27 — preparação do checkout Cakto

Usuário confirmou em 03/10/2026 validade de primeiracompra até 31/10/2026. Horário/fuso ainda não informado; reconferir antes de habilitar contratação. Próxima implementação é o receptor da etapa 28, sem conceder Premium só pelo recebimento de evento. Condições de lançamento e trava permanecem.

Conferência posterior à alteração pelo usuário: API e checkout confirmam R$22,99 base e totais R$12,49 inicial/R$23,98 recorrente em Pix Automático, cartão e Pix. Arredondamento corresponde ao site. Sem pagamento; validade/fuso do cupom e etapas de webhook/verificação permanecem pendentes. Proposta do receptor em WEBHOOK-CAKTO.md.

Novo preço aprovado em 03/10/2026: base R$22,99, inicial promocional arredondada R$11,50; taxa Cakto R$0,99 por cobrança informada separadamente na tela (totais R$12,49 e R$23,98). Contrato e RPC de novas intenções esperam base 1150/2299 e renovação 2299 centavos, via migration incremental 20261003180000. Intenções antigas mantêm valores imutáveis. Oferta remota ainda precisa ser atualizada pelo usuário e reconferida, inclusive arredondamento e validade do cupom. enabled:false preservado.

Atualização 03/10/2026: autenticação e consulta real de ofertas concluídas após usuário salvar credenciais. ID confirmado `8wweqjo`, R$20, assinatura com recurrence_period 30; produto conferido pelo filtro da API. IDs regular e promocional configurados no ambiente local ignorado. Cupom diferencia a URL promocional da mesma oferta. Valores finais/taxas e vigência do cupom continuam pendentes; trava enabled:false preservada. Registros anteriores abaixo são históricos.

Link/cupom fornecidos pelo usuário e conferidos em 03/10/2026, com divergências de preço, taxa e nome pendentes. URLs salvas apenas no servidor local; não ativam contratação. Detalhes e próximos ajustes em [CAKTO.md](CAKTO.md). IDs do produto/oferta continuam necessários. O formato real do link exige migration incremental 20261003170000, sem reescrever o histórico.

Em 03/10/2026 o usuário confirmou a página Premium, autorizou esta etapa e depois escolheu trocar Kiwify por Cakto. Já tem cadastro Cakto, mas ainda não criou produto/oferta. A infraestrutura foi adaptada; **a configuração comercial e a conferência no provedor permanecem pendentes**. Histórico Kiwify está preservado no Git. Veja [contrato atual e roteiro Cakto](CAKTO.md).

## Implementação

`POST /api/premium/checkout` verifica origem e conta com e-mail confirmado. Não aceita payload, parâmetros de consulta, URL, preço, plano ou proprietário enviados pelo cliente. GET não inicia checkout. Respostas privadas não são armazenadas em cache.

O handler preparado consulta o direito vigente e impede nova contratação por conta Premium. Seleciona a oferta usando data do servidor e outubro de 2026 no fuso de São Paulo. Persiste a intenção antes de emitir 303 para HTTPS em `pay.cakto.com.br`. Só permite o caminho do checkout e, opcionalmente, `coupon`; acrescenta uma referência opaca em `sck`, sem e-mail, CPF, nome ou UUID interno. Erros não retornam credenciais nem concedem acesso.

**Trava de lançamento:** a rota real usa `enabled: false`, independentemente das variáveis de ambiente. Conta ausente recebe 401; conta confirmada recebe 503 `checkout_unavailable`. A interface Premium e o botão desabilitado foram preservados. O caminho habilitado foi testado por injeção de dependências com fixtures, não com pagamentos reais. Não há formulário conectado ao endpoint enquanto a trava permanecer.

## Banco privado

Migration `20261003150000_checkout_intents.sql` cria `private.checkout_intents`; `20261003160000_prepare_cakto.sql` adapta provedor/oferta e a RPC para Cakto, conservando registros históricos. Sem acesso direto para anon, authenticated ou service_role. RLS sem policies. Apenas service_role executa a RPC de criação; o UUID deve vir exclusivamente da sessão verificada no servidor.

Cada intenção contém referência aleatória de 32 bytes (256 bits), proprietário, produto/oferta, URL configurada, preços em centavos, BRL, criação e vencimento. Não contém dados do comprador nem evidência de pagamento. Intenções não podem ser atualizadas. Exclusão da conta remove os registros vinculados.

Um lock por conta serializa a criação: a mesma oferta é reutilizada por 15 minutos enquanto vigente; ofertas diferentes são distintas. No máximo quatro novas intenções por hora/conta. Prazo máximo de uma hora, limitado ao fim da campanha para a oferta de outubro. O banco revalida conta confirmada, ausência de Premium ativo, destino e preço compatível com a data, para falhar fechado se o servidor atravessar a virada do mês.

Vencimento limita a associação automática futura, mas **não revoga um link no provedor**. Validade do cupom deve ser configurada na própria Cakto. `sck` pode ser alterado ou substituído por cookies de rastreamento; não é prova de propriedade ou pagamento. Verificação de venda, deduplicação de ordens e consumo seguro da intenção pertencem às próximas etapas. Não associar pela coincidência de e-mail. Não há RPC de leitura pública nem concessão de assinatura nesta etapa.

Retenção/expurgo de intenções e vínculo de renovações serão definidos junto ao processamento de pagamentos. Até o lançamento, a rota desabilitada não cria intenções reais; fixtures SQL são desfeitas por rollback.

## Criar o produto na Cakto

1. No painel, abra **Produtos → Criar produto** e selecione **Assinatura recorrente**.
2. Crie um plano **mensal de R$20**, conferindo recorrência, cancelamento e métodos disponíveis. Não use número fixo de cobranças se a intenção for assinatura contínua.
3. Dentro do produto, abra **Cupons → novo cupom**, selecione **Desconto só na 1ª cobrança da assinatura** e **50%**. Confira no checkout R$10 hoje e R$20 nas renovações, sem taxa de serviço repassada que aumente esses totais. Um plano mensal de R$10 ou cupom permanente não cumpre a oferta aprovada.
4. Restrinja o cupom à oferta correta e às novas contratações de outubro, com validade até **31/10/2026 no fuso de São Paulo**, conferindo as opções e o fuso reais do provedor. Registre como foi verificado o preço das renovações. Se não houver suporte à validade, resolver antes de habilitar pagamento.
5. Envie o **link público do checkout**, o **código do cupom**, o **ID do produto** e o **ID da oferta**, se disponíveis no painel; se não localizar os IDs, podemos conferir o painel juntos. Não enviar senhas ou tokens. Não efetuar compra real para testar esta preparação.

Fontes oficiais consultadas em 03/10/2026: [cupom da primeira cobrança](https://ajuda.cakto.com.br/pt-br/articles/143-cupons-tres-novidades-no-ar), [cupom na URL](https://ajuda.cakto.com.br/pt-br/articles/61-como-usar-a-url-para-criar-um-checkout-pre-preenchido-na-cakto) e [rastreamento](https://ajuda.cakto.com.br/pt-br/articles/54-como-passar-parametros-de-rastreamento-na-url-do-checkout-src-utm-tags-entre-outros). Persistência em cookies e retorno real do sck ainda exigem teste controlado posterior.

## Configuração futura no servidor

Os nomes abaixo são convenções locais, sem valores fictícios no ambiente. Não configurar por `NEXT_PUBLIC`, não colocar segredos no chat e não versionar `.env.local`.

| Variável | Conteúdo |
| --- | --- |
| CAKTO_PRODUCT_ID | Produto permitido |
| CAKTO_REGULAR_OFFER_ID | Oferta mensal regular |
| CAKTO_REGULAR_CHECKOUT_URL | URL oficial da oferta de R$20 |
| CAKTO_OCTOBER_OFFER_ID | Oferta inicial de outubro; pode ser a regular com cupom de primeira cobrança verificado |
| CAKTO_OCTOBER_CHECKOUT_URL | URL oficial com configuração verificada de R$10 inicial / R$20 recorrente |
| APP_ORIGIN | Origem HTTPS pública exata em produção, sem caminho nem parâmetros |

Falta de configuração válida falha fechado; não há fallback para checkout com preço diferente. Configurar essas variáveis não habilita a rota. URLs/IDs configurados no servidor precisam corresponder à oferta conferida no provedor; sintaxe válida sozinha não prova produto, preço ou recorrência.

## Verificação e pendências

Quinze testes Node/HTTP do checkout e regressão Premium passaram em desenvolvimento. Verificam destino restrito, promoção, expiração/contrato, ausência de sessão, Premium ativo, CSRF, rejeição de payload, ordem de persistência/redirecionamento, erros, trava e interface preservada. O teste HTTP inicial encontrou servidor desligado; ao reiniciar, identificou que Next representa POST vazio como stream. Corrigido para aceitar somente EOF sem bytes, com timeout; suíte final passou. Lint, TypeScript e build aprovados.

SQL exercita criação, repetição idempotente, isolamento, preço inválido, conta não confirmada, destino externo, limite por hora, imutabilidade, Premium ativo, RLS, ACLs e exclusão da conta. Ensaio da migration e testes com rollback antes da aplicação. Não valida o comportamento de cookies ou cobranças do provedor.

Migrations de intenções e adaptação Cakto aplicadas; catorze versões locais/remotas sincronizadas. Suítes SQL de intenções/Cakto/assinaturas repetidas após aplicação. Nenhuma oferta ou credencial foi configurada na Cakto; registros de fixtures desfeitos.

Antes da liberação: configurar/conferir produto e oferta; validar `sck` em venda oficial e a promoção/expiração/renovação; implementar webhook e verificação de pagamento; garantir entrega real dos benefícios e conteúdo Premium; domínio HTTPS e teste integral controlado. Retorno do checkout nunca libera acesso. HTTP de produção, concorrência externa e compra real não foram executados nesta etapa.

Para repetir no PowerShell com o servidor dev rodando:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
node --test tests/checkout.test.mjs tests/checkout-http.test.mjs tests/premium.test.mjs tests/premium-http.test.mjs
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_checkout_intents.sql
```

Esperado: 15 testes aprovados e `checkout_intents_security_idempotency_limits_passed=true`; fixtures não persistem. Etapa 27 preparada, aguardando a configuração comercial. Próxima etapa não iniciada.
