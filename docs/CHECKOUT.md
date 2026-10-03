# Etapa 27 — preparação do checkout Kiwify

Em 03/10/2026 o usuário confirmou a página Premium e autorizou esta etapa. Informou que ainda não criou produto nem oferta na Kiwify. A infraestrutura está preparada; **a configuração comercial e a conferência no provedor permanecem pendentes**. Esta etapa não deve ser considerada uma integração de pagamentos pronta para uso.

## Implementação

`POST /api/premium/checkout` verifica origem e conta com e-mail confirmado. Não aceita payload, parâmetros de consulta, URL, preço, plano ou proprietário enviados pelo cliente. GET não inicia checkout. Respostas privadas não são armazenadas em cache.

O handler preparado consulta o direito vigente e impede nova contratação por conta Premium. Seleciona a oferta usando data do servidor e outubro de 2026 no fuso de São Paulo. Persiste a intenção antes de emitir 303 para HTTPS em `pay.kiwify.com.br`. Só permite o caminho do checkout e, opcionalmente, `coupon`; acrescenta uma referência opaca em `sck`, sem e-mail, CPF, nome ou UUID interno. Erros não retornam credenciais nem concedem acesso.

**Trava de lançamento:** a rota real usa `enabled: false`, independentemente das variáveis de ambiente. Conta ausente recebe 401; conta confirmada recebe 503 `checkout_unavailable`. A interface Premium e o botão desabilitado foram preservados. O caminho habilitado foi testado por injeção de dependências com fixtures, não com pagamentos reais. Não há formulário conectado ao endpoint enquanto a trava permanecer.

## Banco privado

Migration `20261003150000_checkout_intents.sql` cria `private.checkout_intents`, sem acesso direto para anon, authenticated ou service_role. RLS sem policies. Apenas service_role executa a RPC de criação; o UUID deve vir exclusivamente da sessão verificada no servidor.

Cada intenção contém referência aleatória de 32 bytes (256 bits), proprietário, produto/plano, URL configurada, preços em centavos, BRL, criação e vencimento. Não contém dados do comprador nem evidência de pagamento. Intenções não podem ser atualizadas. Exclusão da conta remove os registros vinculados.

Um lock por conta serializa a criação: a mesma oferta é reutilizada por 15 minutos enquanto vigente; ofertas diferentes são distintas. No máximo quatro novas intenções por hora/conta. Prazo máximo de uma hora, limitado ao fim da campanha para a oferta de outubro. O banco revalida conta confirmada, ausência de Premium ativo, destino e preço compatível com a data, para falhar fechado se o servidor atravessar a virada do mês.

Vencimento limita a associação automática futura, mas **não revoga um link no provedor**. Validade do cupom deve ser configurada na própria Kiwify. `sck` pode ser alterado ou substituído por cookies de rastreamento; não é prova de propriedade ou pagamento. Verificação de venda, deduplicação de ordens e consumo seguro da intenção pertencem às próximas etapas. Não associar pela coincidência de e-mail. Não há RPC de leitura pública nem concessão de assinatura nesta etapa.

Retenção/expurgo de intenções e vínculo de renovações serão definidos junto ao processamento de pagamentos. Até o lançamento, a rota desabilitada não cria intenções reais; fixtures SQL são desfeitas por rollback.

## Criar o produto na Kiwify

1. No painel, abra **Produtos → Criar produto** e selecione **Assinatura recorrente**.
2. Crie um plano **mensal de R$20**, conferindo recorrência, cancelamento e métodos disponíveis. Não use número fixo de cobranças se a intenção for assinatura contínua.
3. Antes de criar a promoção, confirme no painel/suporte que a configuração consegue cobrar **R$10 somente na primeira mensalidade e R$20 nas renovações**. Um plano mensal de R$10 ou um desconto permanente não cumpre a oferta aprovada.
4. Se a Kiwify confirmar o comportamento desejado do cupom, restrinja-o à oferta correta e às novas contratações de outubro, com validade até **31/10/2026 no fuso de São Paulo**, conferindo o fuso usado pelo provedor. Registre como foi verificado o preço das renovações. Se não houver suporte, ajustar a condição comercial antes de habilitar pagamento.
5. Envie o **link público do checkout**, o **ID do produto** e o **ID do plano** exibidos no painel; se não localizar os IDs, podemos conferir o painel juntos. Não enviar senhas ou tokens. Não efetuar compra real para testar esta preparação.

Fontes oficiais consultadas em 03/10/2026: [criar assinatura](https://ajuda.kiwify.com.br/pt-br/article/como-criar-um-produto-de-assinatura-9crmrj/), [cupons](https://ajuda.kiwify.com.br/pt-br/article/cupons-de-desconto-l808xv/) e [rastreamento](https://ajuda.kiwify.com.br/pt-br/article/como-passar-parametros-de-rastreamento-na-url-do-checkout-src-utm-tags-entre-outros-1spiptc/). A documentação permite cupom em recorrência, período de validade e `?coupon=...`, mas não estabelece no texto consultado que afeta somente a primeira cobrança. Também informa persistência dos parâmetros em cookies; o retorno do `sck` da nossa intenção precisa de teste real controlado posterior.

## Configuração futura no servidor

Os nomes abaixo são convenções locais, sem valores fictícios no ambiente. Não configurar por `NEXT_PUBLIC`, não colocar segredos no chat e não versionar `.env.local`.

| Variável | Conteúdo |
| --- | --- |
| KIWIFY_PRODUCT_ID | Produto permitido |
| KIWIFY_REGULAR_PLAN_ID | Plano mensal regular |
| KIWIFY_REGULAR_CHECKOUT_URL | URL oficial do plano de R$20 |
| KIWIFY_OCTOBER_PLAN_ID | Plano vinculado à oferta inicial de outubro; pode ser o regular se o cupom correto for confirmado |
| KIWIFY_OCTOBER_CHECKOUT_URL | URL oficial com configuração verificada de R$10 inicial / R$20 recorrente |
| APP_ORIGIN | Origem HTTPS pública exata em produção, sem caminho nem parâmetros |

Falta de configuração válida falha fechado; não há fallback para checkout com preço diferente. Configurar essas variáveis não habilita a rota. URLs/IDs configurados no servidor precisam corresponder à oferta conferida no provedor; sintaxe válida sozinha não prova produto, preço ou recorrência.

## Verificação e pendências

Quinze testes Node/HTTP do checkout e regressão Premium passaram em desenvolvimento. Verificam destino restrito, promoção, expiração/contrato, ausência de sessão, Premium ativo, CSRF, rejeição de payload, ordem de persistência/redirecionamento, erros, trava e interface preservada. O teste HTTP inicial encontrou servidor desligado; ao reiniciar, identificou que Next representa POST vazio como stream. Corrigido para aceitar somente EOF sem bytes, com timeout; suíte final passou. Lint, TypeScript e build aprovados.

SQL exercita criação, repetição idempotente, isolamento, preço inválido, conta não confirmada, destino externo, limite por hora, imutabilidade, Premium ativo, RLS, ACLs e exclusão da conta. Ensaio da migration e testes com rollback antes da aplicação. Não valida o comportamento de cookies ou cobranças do provedor.

Migration aplicada e treze versões locais/remotas sincronizadas. Suíte SQL repetida após aplicação; auditoria final encontrou zero intenções, zero assinaturas e zero questões publicadas. Nenhuma oferta ou credencial foi configurada na Kiwify.

Antes da liberação: configurar/conferir produto e oferta; validar `sck` em venda oficial e a promoção/expiração/renovação; implementar webhook e verificação de pagamento; garantir entrega real dos benefícios e conteúdo Premium; domínio HTTPS e teste integral controlado. Retorno do checkout nunca libera acesso. HTTP de produção, concorrência externa e compra real não foram executados nesta etapa.

Para repetir no PowerShell com o servidor dev rodando:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
node --test tests/checkout.test.mjs tests/checkout-http.test.mjs tests/premium.test.mjs tests/premium-http.test.mjs
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_checkout_intents.sql
```

Esperado: 15 testes aprovados e `checkout_intents_security_idempotency_limits_passed=true`; fixtures não persistem. Etapa 27 preparada, aguardando a configuração comercial. Próxima etapa não iniciada.
