# Recuperação confirmada e autenticação Cakto — etapa 51

Atualização de 14/10/2026, horários de São Paulo (UTC−3).

## Recuperação de senha concluída

Após configurar SMTP Gmail diretamente no Supabase, o responsável confirmou o recebimento do e-mail, o salvamento de nova senha e o login usando essa nova senha. Essa é evidência relatada pelo usuário do fluxo positivo real. O agente não recebeu credenciais SMTP, senha, token ou link e não mudou a senha. Os testes administrativos da etapa 50 continuam distintos e não passam a certificar entrega. Não há confirmação de novo cadastro por e-mail ou de capacidade de envio em escala.

## Causa observada da falha da automação

O resumo privado instrumentado na etapa 48 registrou uma falha real em descoberta, categoria `provider_unavailable`, operação `authentication`, status **502**. Conclusão em `2026-10-15T00:39:02.608425Z`, equivalente a **14/10/2026 21:39:02** em São Paulo. Outra execução concluiu às **21:45:09** com `provider_timeout` na autenticação, sem status HTTP disponível. Eram execuções anteriores à mudança desta etapa.

Isso identifica duas falhas na autenticação com o provedor; não prova a causa de todos os 503 históricos. HTTP 502 não é evidência de credenciais inválidas. Nenhuma chave foi rotacionada por suposição. O fluxo de token mantém o host fixo e formulário documentados em [Autenticação Cakto](https://docs.cakto.com.br/authentication).

## Proteção implementada

`caktoReader` admite **uma segunda tentativa**, somente quando a primeira autenticação retorna HTTP **500, 502, 503 ou 504**. Pausa de 250 ms entre as tentativas; ambas, inclusive o corpo e a pausa, compartilham o prazo original de **oito segundos**. O cancelamento encerra a pausa e impede iniciar uma requisição depois do prazo, mesmo se o transporte ignorar abort. Cancelamento de corpo não é aguardado sem limite.

Não se repetem automaticamente credenciais recusadas, 404, 429, outros status, exceções de transporte, resposta JSON inválida ou consultas de lista/pedido/assinatura. Uma segunda falha conserva o diagnóstico final. A Edge registra `cakto_authentication_retry` com somente operação e status fixos; falha de observador não modifica o resultado. Nenhum corpo, token, URL, credencial ou comprador integra esse evento.

A função foi publicada como versão **4**, ativa, mantendo HMAC e nonce, sem mudar segredo, cursor, reserva, agendamento, SQL ou critérios financeiros. A resposta HTTP pública permanece genérica em falhas finais. A mudança reduz o efeito de uma primeira resposta temporária; não promete disponibilidade do provedor nem recupera um timeout inicial sem resposta.

## Verificações

Passaram **29 testes Node**: 22 existentes de automação, pagamento, ciclo e reconciliação, mais sete de repetição. Casos novos cobrem os quatro status permitidos, sucesso após falha, segunda falha, sigilo do diagnóstico, erros sem repetição, consultas sem repetição, observador com erro, prazo total compartilhado e resposta tardia sem nova requisição. O grupo de sete foi repetido após o ajuste final de cancelamento e passou. Lint, build e TypeScript aprovados. `npm run test:payment` inclui a nova suíte.

Não houve compra, envio de e-mail, criação de período pago ou alteração do conteúdo. Não foi repetido o teste de senha do usuário. A conversa de suporte foi consultada e continha somente a solicitação enviada; não foi enviado novo contato.

## Execução automática após a publicação

O agendamento existente disparou às **21:51:00 de 14/10/2026** (`2026-10-15T00:51:00Z`). A versão 4 concluiu às **21:51:03**, com HTTP **200**, `lastOk:true`, zero pedidos encontrados/ignorados e nenhum truncamento. A amostra de 21:51:21 confirmou os dois jobs ativos, fila/assinaturas/provas/períodos/renovações em zero, 500 questões e seis modelos publicados. A próxima busca ficou para 22:06:03, pelo intervalo já existente. Nenhum disparo foi antecipado manualmente.

O sucesso dessa execução não informa se a segunda tentativa foi necessária; a recuperação após um primeiro 5xx foi comprovada nos testes controlados, não atribuída à execução real sem o respectivo log. Não demonstra fim definitivo da intermitência.

## Pendências externas

Continuam pendentes a resposta oficial sobre staging, moeda e valores da API, condições do cupom e a validação comercial positiva de pagamento. O checkout permanece `checkoutEnabled:false`; 500 questões e seis modelos publicados são preservados.
