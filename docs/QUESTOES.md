# Questões e gabarito protegido — etapa 8

Etapa concluída. O “continue” confirmou o teste da etapa 7. A migration 20260925085403_create_questions_and_protected_answers.sql foi aplicada no projeto clxnqrkdalimrqcnhegr, com histórico local/remoto sincronizado. Aguardando teste do usuário antes da etapa 9.

## Estrutura

public.questions guarda enunciado, alternativas e metadados. public.question_answers guarda a alternativa correta e a explicação, em relação de um gabarito por questão. A chave estrangeira impede gabaritos sem questão e impede apagar uma questão enquanto seu gabarito existir. Rascunhos podem existir antes do gabarito.

| Campo em questions | Regra |
| --- | --- |
| id | UUID gerado pelo banco |
| statement | Texto obrigatório, de 1 a 20.000 caracteres após aparar espaços nas bordas |
| option_a até option_e | Cinco alternativas obrigatórias, de 1 a 4.000 caracteres cada |
| subject | matematica, portugues, ciencias, historia ou geografia |
| topic | Assunto obrigatório, até 160 caracteres |
| difficulty | easy, medium ou hard |
| target_exam | etec, if ou both |
| status | draft por padrão; valores aceitos: draft, reviewed, published |
| version | Inteiro positivo; começa em 1 |
| created_at / updated_at | Data com fuso; updated_at atualizado por trigger |

| Campo em question_answers | Regra |
| --- | --- |
| question_id | Chave primária e referência a questions.id |
| correct_answer | Uma letra maiúscula: A, B, C, D ou E |
| explanation | Texto obrigatório, até 20.000 caracteres |
| created_at / updated_at | Data com fuso; updated_at atualizado por trigger |

O formato inicial usa cinco alternativas por questão. Se houver necessidade de questões com quatro alternativas, adaptar o modelo e os testes em nova migration. Conteúdo deve ser tratado como texto; limites de tamanho não substituem validação e renderização segura na aplicação.

## Acesso e proteção

RLS (Row Level Security) filtra quais registros cada papel pode acessar. GRANT define se o papel pode executar uma operação. Usamos os dois: RLS habilitado sem políticas de liberação, e todas as permissões diretas retiradas de PUBLIC, anon e authenticated. Isso protege inclusive questões publicadas e explicações.

| Papel | questions | question_answers |
| --- | --- | --- |
| anon (visitante) | Sem leitura ou escrita direta | Sem leitura ou escrita direta |
| authenticated (usuário logado) | Sem leitura ou escrita direta | Sem leitura ou escrita direta |
| service_role (servidor privilegiado) | Apenas SELECT | Apenas SELECT |
| postgres (gestão do banco) | Administração e migrations | Administração e migrations |

service_role ignora RLS, mas ainda precisa dos GRANTs; seus privilégios herdados foram revogados nessas duas tabelas e somente SELECT foi concedido. Nenhuma chave administrativa foi obtida ou configurada no aplicativo. Permissões futuras de escrita exigirão uma decisão explícita e nova migration.

A função private.set_updated_at é apenas um trigger interno, sem SECURITY DEFINER e com search_path vazio. Não existe RPC pública de consulta ou correção. Não foram criadas views, rotas ou consultas de navegador para estas tabelas.

Nas etapas do quiz, o servidor deverá validar a tentativa, selecionar apenas suas questões e devolver campos explícitos sem gabarito. A correção deverá confirmar que a questão pertence à tentativa antes de consultar a resposta. Acesso privilegiado não substitui essas verificações.

## Revisão e versões

Novas questões começam em draft. O banco restringe os valores de status, mas ainda não implementa o fluxo de aprovação humana ou a transição entre estados; essas regras pertencem à publicação administrativa. Nenhum conteúdo foi publicado nesta etapa. Não publicar automaticamente questões geradas por IA.

version é a base para a identificação editorial. Ainda não há tentativas nem bloqueio de edição de questões utilizadas. Antes de registrar tentativas, preservar id/versão e impedir alterações silenciosas em conteúdo já usado, incluindo gabarito e explicação. Uma alteração relevante deve gerar novo registro/versão; apenas incrementar version na mesma linha não preserva o conteúdo anterior.

## Teste pelo usuário

Abra o PowerShell e execute um comando por vez:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npx.cmd --no-install supabase migration list --linked
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_questions_security.sql
npm.cmd run test:questions
```

Esperado: migrations 20260925015139 e 20260925085403 presentes em local e remote; seis linhas passed=true na consulta; três testes aprovados pelo Node (um principal e dois subtestes). Não é necessário iniciar o site: o teste HTTP consulta diretamente o Supabase com a chave pública de .env.local. Ele confirma primeiro que a chave é válida e depois exige rejeição das duas leituras.

Para repetir os testes de comportamento no banco de desenvolvimento:

```powershell
npx.cmd --no-install supabase db query --linked --file supabase/tests/test_questions.sql
```

Esperado: questions_behavior, checks_passed=51 e passed=true. Esse teste insere fixtures e concede permissões temporárias somente dentro de uma transação; ROLLBACK desfaz tudo. Não é seed e não publica questões persistentes. Uma falha gera erro e reprova a execução.

Se a CLI perder o login, executar supabase login no terminal local. Para erro transitório de conexão, repetir isoladamente o comando de consulta; não aplicar novamente migrations nem usar reset/repair. Para passed=false ou erro nos testes, copiar somente a mensagem sem credenciais e interromper o avanço.

## Verificação realizada e limites

- Dry-run revisado: apenas a migration nova; aplicação concluída.
- 51 verificações SQL: defaults, validações, integridade, timestamps, negação de SELECT/INSERT/UPDATE/DELETE para anon/authenticated, RLS testado separadamente com GRANTs temporários e leitura privilegiada funcional.
- Seis verificações de catálogo aprovadas após o rollback, confirmando também que as concessões temporárias não permaneceram.
- Teste HTTP com chave pública válida: questões e gabaritos bloqueados; três testes Node aprovados.
- Contagens depois dos testes: zero questões e zero gabaritos.
- npm run lint aprovado; git diff --check aprovado.

O papel authenticated foi testado no próprio PostgreSQL com SET LOCAL ROLE; não foi criada conta real nem sessão HTTP de usuário logado. Docker continua indisponível, portanto os testes SQL foram executados no projeto remoto de desenvolvimento. Build não repetido porque o código da aplicação não mudou. Nenhuma dependência ou variável de ambiente nova.

Critério de conclusão cumprido: estrutura versionada, gabarito separado, acesso comum bloqueado, testes de permitir/negar aprovados e histórico sincronizado. O quiz e a correção ainda não estão implementados. Próxima etapa: seed, após confirmação do usuário.

## Referências oficiais consultadas

- [Supabase: RLS e permissões](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase: segurança da Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [PostgreSQL 17: constraints](https://www.postgresql.org/docs/17/ddl-constraints.html)
