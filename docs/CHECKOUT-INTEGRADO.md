# Checkout integrado — implementação e liberação

## Estado em 21/10/2026

Implementado em `/premium/pagamento`: Pix, Pix Automático e cartão, resumo mensal, validação de CPF/telefone/cartão, QR local, cópia do Pix, prazo real do código, recuperação de status e retomada idempotente. A interface mantém a identidade existente e não altera assinaturas ou concede acesso por resposta do navegador.

**A contratação integrada permanece desabilitada em produção.** Sem `CAKTO_DIRECT_CHECKOUT_ENABLED=true`, o fluxo público continua usando o checkout hospedado existente. Essa condição também impede criação e retomada financeira pelo endpoint, mas preserva consulta de status de tentativas anteriores. Não ativar apenas porque a compilação passou.

Permissões verificadas com a chave existente após ajuste pelo responsável: leitura do produto HTTP 200; POST financeiro com corpo vazio HTTP 400, antes retornava 403. Essa requisição inválida não criou pedido, Pix ou cobrança. A oferta autenticada é uma assinatura mensal ativa de R$ 22,99, BRL, recorrência de 30 dias, sem limite de renovações; o produto lista `pix_auto`, `credit_card` e `pix`.

## Limites ainda não comprovados

- Não foi criada nem paga transação real, conforme instrução do responsável. Não há sandbox oficial da Cakto.
- O processamento de Pix/mandato e cartão, a elegibilidade financeira da conta para pagamentos diretos, CORS/tokenização/antifraude em produção e a composição efetiva da taxa na API ainda não foram comprovados ponta a ponta. Permissão HTTP não prova esses requisitos.
- O total atual de R$ 23,98 (R$ 22,99 + R$ 0,99) foi observado no checkout hospedado. O código recusa respostas diretas com total, moeda ou oferta divergentes, mas essa checagem ocorre **depois** da solicitação financeira: não substitui confirmar previamente a precificação da API antes de habilitar o formulário.
- O SDK oficial contém um fallback simulado em `authenticate3DS`. Este projeto **não chama esse método e não anuncia autenticação 3DS**. Se o adquirente exigir 3DS, manter cartão desabilitado até uma integração real, verificável e sem esse fallback. Não remover proteções para liberar a contratação.
- Uma URL hospedada obtida anteriormente pode continuar válida na Cakto. A trava local impede novas intenções enquanto há pagamento direto pendente; não é uma garantia de que o provedor recusará duas compras independentes.

## Segurança e dados

- Identidade e e-mail confirmados vêm exclusivamente do servidor. O cliente não escolhe preço, e-mail beneficiário, oferta, referência, proprietário ou destino. POST exige origem exata, JSON limitado, autenticação e disponibilidade do recurso.
- RPCs restritas a `service_role`, RLS, ausência de leitura direta da tabela e isolamento por conta. Intenção hospedada e tentativa direta compartilham o mesmo lock transacional.
- Uma tentativa pendente por conta, lease de 60 s, até quatro tentativas novas/hora e consultas financeiras limitadas a uma por 30 s. GET periódico consulta somente o estado local. Sem novo pagamento após timeout ou resultado incerto.
- O corpo financeiro é persistido **antes** do POST, com UUID de idempotência. Retomada reutiliza corpo e chave. Criptografia AES-256-GCM, chave derivada via HKDF do segredo Cakto já existente. Nenhum segredo adicional é exposto. Rotacionar esse segredo pode impedir a retomada de tentativas incertas; resolver pagamentos pendentes antes da rotação.
- Dados de pagador e token temporário ficam criptografados, são eliminados ao concluir a tentativa ou pela rotina horária quando completam 24 h (janela normal de até 25 h). O job novo remove apenas esse material cifrado, preservando auditoria e cron financeiro existentes. Não registrar payloads, erros brutos do provedor, tokens, QR ou dados pessoais em logs.
- PAN e CVV ficam apenas no formulário não controlado e são enviados diretamente do navegador à Cakto. Após a tokenização os campos são limpos. O servidor recebe somente token e referência antifraude. A tokenização usa `fetch` direto para evitar logging de payloads em erros Axios do SDK.
- SDK com SRI; CSP permite origens adicionais somente na rota de pagamento e quando o recurso está habilitado. Campos sensíveis usam os nomes `number` e `cvc` esperados pelo mascaramento do antifraude. Não chamar `initAntifraud` em testes com dados reais.
- `paid`, QR gerado e autorização Pix não concedem Premium. Os webhooks e o verificador financeiro existentes continuam responsáveis por comprovação, vínculo e período de acesso.

## Operação e rollback

As duas migrações aditivas foram testadas em transações com rollback, aplicadas e testadas novamente. A primeira cria o ledger privado e RPCs; a segunda adiciona o wrapper atômico da intenção. Não excluir tabelas/linhas para desbloquear um pagamento incerto.

Para desabilitar novas compras diretas, remover a flag ou usar `false` e publicar novamente, preservando banco, webhooks e verificador. Consultas de tentativas anteriores continuam disponíveis. Se reverter para código anterior ao checkout integrado, interromper primeiro novas compras e resolver tentativas pendentes: versões antigas não consultam o ledger novo.

## Validação reproduzível

- `node --test tests/direct-checkout.test.mjs tests/direct-card.test.mjs` — contratos, criptografia, estado, retomada, identidade, HTTP, transporte, tokenização sem rede financeira.
- `node scripts/test-direct-checkout-sql.mjs` — ACL/RLS, isolamento, lease, retenção, idempotência e bloqueio do checkout hospedado. Fixtures isoladas, transação revertida.
- Testes existentes de planos, checkout, processamento, moeda e autenticação Cakto; TypeScript, ESLint e build.
- Navegador isolado, conta descartável, 320/390/768/1280 px: sem overflow ou erro de execução. Cartão aberto sem tokenizar. Requisições financeiras do navegador bloqueadas durante a conferência; nenhuma foi disparada.
- Advisors: nenhum aviso nas novas tabelas ou funções; permanecem avisos anteriores de `rls_auto_enable()` e proteção de senhas vazadas indisponível/desabilitada. Não modificados neste escopo.

## Referências oficiais consultadas

- [Fluxo de pagamento](https://docs.cakto.com.br/conceitos/fluxo-de-pagamento)
- [Idempotência](https://docs.cakto.com.br/conceitos/idempotencia)
- [Pix](https://docs.cakto.com.br/api-reference/payments/create-pix)
- [Pix Automático](https://docs.cakto.com.br/api-reference/payments/create-pix-auto)
- [Cartão](https://docs.cakto.com.br/api-reference/payments/create-card)
- [Tokenização](https://docs.cakto.com.br/sdk/tokenizacao) e [antifraude](https://docs.cakto.com.br/sdk/antifraude)
