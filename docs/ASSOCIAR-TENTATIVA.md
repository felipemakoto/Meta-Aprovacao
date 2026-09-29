# Etapa 17 — associar tentativa à conta

Escopo preparado em 29/09/2026. Implementação ainda não iniciada. Etapa 16 concluída com confirmação do usuário de troca de senha e novo login.

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
