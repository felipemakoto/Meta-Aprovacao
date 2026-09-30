# Etapa 19 — banco de questões

Implementado em 30/09/2026 após aprovação explícita do mockup. Verificações funcionais concluídas; comparação visual por navegador e teste manual do usuário pendentes.

## O que funciona

- /questoes exige conta com e-mail confirmado. Filtros por matéria, assunto, dificuldade e prova alvo. Aplicar filtros retorna uma questão publicada por vez; Próxima questão mantém os filtros e evita repetir a anterior quando há outra disponível.
- /api/practice recebe identidade exclusivamente de getUser verificado. GET retorna somente assuntos da matéria (até 200); POST aceita contratos exatos para obter questão ou conferir resposta. Sem corpo com usuário, nota, gabarito ou campos adicionais; limite de 2048 bytes, prazo de leitura, CSRF e respostas privadas/no-store.
- private.practice_attempts com RLS, sem privilégios diretos, pertence a um usuário e guarda snapshot privado da versão, opções e gabarito. RPCs executáveis somente pelo servidor privilegiado. Antes da resposta, DTO público não inclui gabarito/explicação.
- Resposta válida dentro de 30 minutos é corrigida pela cópia original, mesmo se o conteúdo vivo for alterado. Trava FOR UPDATE; repetir a mesma resposta é idempotente, trocá-la após correção recebe conflito. Outra conta não pode usar a tentativa.
- Depois de responder, mostra acerto/erro, alternativa correta e explicação; alternativas ficam bloqueadas. Trocar filtros encerra a questão exibida. Estados de falha, sem resultados, envio e sessão ausente tratados.
- Limite técnico: até 30 novas tentativas por minuto por usuário, serializado por trava consultiva no banco. É controle operacional; limites comerciais e Premium continuam para a etapa 23.
- Link Praticar questões por conteúdo no dashboard. O resumo de atividade do dashboard continua contabilizando testes salvos; agregação de prática individual deve ser definida nas etapas de histórico/estatísticas. Não apresenta prática como um simulado.

## Prévia

http://localhost:3000/questoes/preview disponível só em desenvolvimento. Questão ilustrativa com B selecionada para corresponder ao mockup. Conferir resposta mostra explicação local; Próxima questão permite tentar outra alternativa. Filtros incompatíveis com a única fixture mostram estado vazio. Nenhuma chamada de prática ao banco é feita na prévia; ela não comprova persistência real.

Questões reais continuam em rascunho. Sem conteúdo publicado, a prática real deve retornar nenhuma questão disponível. Nenhum lote foi publicado nesta etapa.

## Verificações

- 7 testes unitários/handlers + 3 HTTP reais aprovados. Contratos exatos, origem, tamanho, sessão, ausência de gabarito, feedback consistente e status de falhas conferidos.
- test_practice.sql aprovado no Supabase: filtros, rejeição de rascunho, snapshot após edição, isolamento por conta, idempotência, resposta alterada, expiração, limite técnico e privilégios. Fixture inédita publicada apenas dentro de transação e revertida integralmente; usuários fictícios também revertidos.
- Migration 20260930120000 aplicada após dry-run. Nenhum reset ou alteração de configurações de autenticação.
- lint e build aprovados. Servidor dev iniciado após ECONNREFUSED nos primeiros testes; HTTP passou após iniciar.
- Servidor temporário de produção confirmou redirect para login, resposta privada/no-store e prévia 404; depois encerrado.
- Inspeção visual/console/teclado não realizada: recusa de política do navegador registrada nas etapas anteriores. Não houve contorno; design-qa.md mantém blocked para esta comparação. Testes HTTP não substituem QA visual.

## Teste do usuário

1. Abra a prévia e confira os quatro filtros e a composição do mockup.
2. Com B selecionada, clique em Conferir resposta: deve informar acerto e explicar 80 − 12 = 68.
3. Clique em Próxima questão, selecione A e confira: deve mostrar Vamos revisar, alternativa B e explicação.
4. Mude a dificuldade para Difícil e aplique: deve mostrar nenhuma questão ilustrativa correspondente. Volte a Todas/Matemática/Porcentagem para praticar novamente.
5. Na conta real, abra Praticar questões por conteúdo no dashboard. O teste com conteúdo real depende da revisão/publicação editorial.

```powershell
npm.cmd run test:practice
npm.cmd run test:practice:http
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_practice.sql
```
