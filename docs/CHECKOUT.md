# Checkout Premium — 21/10/2026

`/premium` apresenta a contratação para contas verificadas sem Premium. Assinantes ativos continuam com seu plano e acesso aos estudos, sem botão de compra. O botão do cadastro confirmado passa por essa página antes da Cakto. Os recursos gratuitos continuam funcionando.

## Preço e fluxo

- Assinatura regular R$ 22,99/mês desde a primeira cobrança; taxa Cakto atual de R$ 0,99; total R$ 23,98/mês. Não há cupom automático, preço anterior ou urgência promocional.
- A página não coleta dados pessoais ou de cartão. O POST existente verifica sessão, origem e direito Premium e cria/reutiliza a intenção no banco. Só depois é aberta a URL HTTPS validada da oferta regular na Cakto, com a referência opaca persistida.
- Os dois botões compartilham trava, carregamento e erros. Retornar pelo navegador libera novamente os controles. O servidor mantém o bloqueio transacional e reutiliza a intenção elegível; a confirmação financeira e a deduplicação de eventos existentes não foram alteradas. Isso não equivale a prometer que o provedor nunca aceitará duas compras feitas separadamente.
- Não há contador. `expiresAt` na intenção interna valida o vínculo do pagamento; não é evidência de que o checkout hospedado expira naquele instante.
- Pix, Pix Automático e cartão foram conferidos no checkout público, com o preço e a taxa acima. Os campos e sua validação pertencem à Cakto. Nenhuma compra foi realizada. O cancelamento segue o canal de suporte e os termos existentes, sem inventar botão de autosserviço ou prazo de reembolso.

## Design e conteúdo

Benefícios agrupados, lista completa compartilhada de recursos, comparação compacta, FAQ junto ao pagamento e barra móvel com total. Sem depoimentos não comprovados. A imagem `public/images/premium-review-card.png` é uma captura de uma questão publicada na interface real de revisão, usando uma conta descartável de teste; não contém identidade, histórico privado ou resultado inventado. Não é um controle interativo.

## Contrato preservado

`POST /api/premium/checkout` não aceita payload, preço, destino, proprietário ou parâmetros do cliente. Conta com e-mail confirmado, origem permitida e ausência de Premium vigente são verificadas antes de criar a intenção; GET não inicia compra. Respostas privadas têm `no-store`. O cliente agora também recusa caminho arbitrário, cupom, parâmetros extras e referência fora do formato esperado na resposta de navegação.

`private.checkout_intents` continua com RLS e sem leitura direta pública. A RPC autorizada recebe exclusivamente o proprietário verificado no servidor; mantém lock por conta, reutilização elegível por 15 minutos, até quatro intenções novas por hora e prazo interno de uma hora. A referência aleatória não prova pagamento. Concessão, renovações, deduplicação e comprovação financeira permanecem no fluxo existente; nenhuma migração nesta alteração.

Configuração regular existente, somente no servidor: `CAKTO_PRODUCT_ID`, `CAKTO_REGULAR_OFFER_ID`, `CAKTO_REGULAR_CHECKOUT_URL` e `APP_ORIGIN`. Não versionar valores, expor em `NEXT_PUBLIC` ou substituir a autorização por parâmetros do navegador. Registros históricos antigos continuam necessários para verificar comprovantes anteriores.

## Instrumentação e experimentos

`window` recebe o evento local `meta:checkout` com `detail.name`, `variant` e, quando aplicável, `placement`, `reason` ou `item`. Nomes: `checkout_view`, `checkout_start`, `checkout_redirect`, `checkout_error`, `checkout_faq`, `checkout_preview`. Valores financeiros, e-mail, IDs, referência de pagamento e URLs não entram nesses eventos. Falhas de observadores não bloqueiam a contratação.

Variante atual: `clarity-v1`, também em `data-checkout-variant`. A estrutura permite identificar versões futuras, mas não há distribuição A/B, cookies de experimento nem coletor externo instalado. Para medir conversão, conectar um consumidor consentido a esses eventos e usar confirmações financeiras verificadas como resultado da compra; redirecionamento não significa pagamento aprovado.

## Limites do checkout hospedado

O formulário da Cakto ainda exibe o campo genérico de cupom, embora o cupom antigo esteja excluído e o site não envie desconto. Ocultar esse campo ou alterar texto, campos obrigatórios e identidade visual dentro do pagamento exige configuração no painel da Cakto; não usar scripts para modificar uma página de outro domínio. O plano, valor-base, recorrência, webhooks e renovações permanecem preservados.

## Validação

- `node --test tests/checkout.test.mjs tests/checkout-action.test.mjs tests/checkout-events.test.mjs tests/promotion-pages.test.mjs`.
- `CHECKOUT_TEST_ORIGIN=http://127.0.0.1:3085` permite usar o script existente `scripts/test-promotion-production.mjs` no servidor local configurado com a mesma origem. Sem a variável, verifica a produção. Testa preço regular, intenção reutilizada, conta sem pagamento e histórico antigo. A conta descartável é removida no bloco final.
- `--browser` nesse script mantém a conta temporária disponível por até 15 minutos, com dados de acesso somente no arquivo temporário local. Marcar o arquivo `.done` encerra a conferência e dispara a limpeza. Nunca usar uma conta de aluno ou efetuar pagamento para esse teste.
