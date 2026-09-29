# Etapa 17 — associar tentativa à conta

Implementada em 29/09/2026 após solicitação do usuário. Testes automatizados concluídos; conferência visual e teste real do usuário pendentes. Etapa 16 concluída com confirmação de troca de senha e novo login.

## Entrega e verificações

- Migration 20260929120000 aplicada após dry-run; cinco migrations locais/remotas sincronizadas.
- Tabela privada quiz_result_owners com RLS e sem privilégios diretos. RPCs claim_quiz_result e read_saved_quiz_result executáveis apenas por service_role; API obtém usuário confirmado por getUser, sem aceitar identidade do payload.
- Associação exige cookie válido, tentativa concluída e ainda no prazo. SELECT FOR UPDATE serializa reivindicações da mesma tentativa; repetição pelo mesmo proprietário é idempotente, outra conta recebe indisponibilidade. A concorrência é protegida pela trava; não houve teste de carga com duas conexões simultâneas.
- Sucesso encerra o prazo anônimo no banco, bloqueando leitura e reenvio por token visitante. Leitura autenticada independe desse prazo e retorna apenas o resultado mais recentemente salvo pelo proprietário. Histórico completo fica para etapa 20.
- POST /api/quiz/saved sem corpo/query, origem validada; GET sem IDs e sem cache. Falhas operacionais não são tratadas como sucesso.
- Resultado ganhou Salvar na minha conta; login autenticado e confirmação de cadastro ganharam link fixo de retorno. A associação ocorre ao clicar em salvar após entrar; não há gravação automática no callback. Minha conta oferece Ver último resultado salvo. Resultado/revisão reutilizam o visual aprovado, sem nova tela de dashboard.
- 37 testes Node passaram entre associação, HTTP real, correção, cliente de resultado, login e cadastro. SQL de associação confirmou isolamento, idempotência, expiração, tentativa incompleta e privilégios. As 35 verificações SQL anteriores da correção também passaram. Lint sem avisos e build aprovados.
- Fixtures SQL criadas dentro de transação e revertidas ao final, inclusive usuários fictícios. Nenhuma questão permaneceu publicada e nenhum resultado de exemplo foi associado à conta real.
- Servidor local estava desligado; foi iniciado novamente na porta 3000 e os testes HTTP passaram. A ferramenta de navegador recusou acesso à URL local por política; não foi contornada. Não há evidência visual nova nesta etapa.

## Como conferir

1. Abra http://localhost:3000/login. Após entrar, confira Ver último resultado salvo e Voltar ao resultado do teste para salvar.
2. Sem resultado associado, a consulta autenticada deve informar que ainda não há resultado salvo. Sem sessão, deve solicitar login.
3. http://localhost:3000/quiz/result/preview mostra o botão desabilitado: dados ilustrativos não podem ser salvos.
4. Quando houver questões revisadas e publicadas, finalize um teste real, clique em Salvar na minha conta; se necessário, entre/crie conta e volte pelo link do resultado. Salve antes de vencerem os 30 minutos da tentativa.
5. Após salvar, confira Resultado salvo na sua conta, revisão dos erros e acesso por Minha conta mesmo depois do prazo anônimo. Outra conta não deve encontrar esse resultado.

O passo 4 ainda depende da revisão/publicação editorial, fora do escopo desta etapa. Não usar a prévia como se comprovasse uma gravação real.

Comandos de verificação, na pasta do projeto:

```powershell
npm.cmd run test:claim
npm.cmd run test:claim:http
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_quiz_claim.sql
```

Referência consultada: [funções e privilégios no Supabase](https://supabase.com/docs/guides/database/functions). Guias locais do Next: route handlers e cookies. As seções abaixo preservam o escopo planejado.

## Resultado esperado

Permitir guardar na conta o resultado real de um teste finalizado como visitante, preservando respostas, nota e explicações. Reutilizar as telas aprovadas de resultado, cadastro e login. Dashboard pertence à etapa 18; histórico completo à etapa 20.

## Trabalho previsto

- Criar vínculo persistente entre tentativa concluída e usuário autenticado, com migration e acesso restrito.
- Verificar sessão no servidor e comprovar posse da tentativa pelo cookie opaco existente. Não aceitar identificador de usuário enviado pelo navegador como autorização.
- Fazer a associação de forma atômica e idempotente: repetir a mesma operação não duplica dados; uma tentativa já vinculada não pode ser transferida a outra conta.
- Oferecer no resultado a ação de salvar na conta; encaminhar visitantes ao cadastro/login e retornar ao resultado por um destino fixo e seguro.
- Permitir leitura posterior do resultado pelo proprietário, mesmo após expirar o acesso anônimo. Não expor gabaritos ou resultados de outras pessoas.
- Tratar ausência de sessão, tentativa incompleta, acesso expirado, erro de conexão e associação já concluída.
- Manter prévias ilustrativas fora da persistência real. Questões permanecem em rascunho até revisão editorial.

## Ponto de atenção confirmado no código

A leitura atual do resultado exige que a tentativa ainda não tenha expirado; o prazo inicial é de 30 minutos. A implementação deve distinguir o prazo para reivindicar a tentativa como visitante do acesso posterior como proprietário. Cadastro e confirmação de e-mail podem ultrapassar esse prazo: nesse caso, apresentar indisponibilidade honesta, sem reabrir um token expirado ou prometer associação que não ocorreu.

## Verificação prevista

Testar associação válida, repetição, concorrência entre contas, tentativa expirada/incompleta, ausência de sessão, origem inválida e isolamento na leitura. Conferir navegação cadastro/login/resultado, lint e build. Para validar persistência sem publicar questões de rascunho, preparar fixtures isoladas e limpeza identificável. Ao concluir, registrar evidências e pausar para o teste do usuário.

Antes de escrever código, consultar os guias Next instalados e a documentação oficial aplicável do Supabase. Se o trabalho exigir uma nova tela importante, apresentar o mockup para aprovação conforme o fluxo original do projeto.
