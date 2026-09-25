# Seed — etapa 9

Etapa técnica concluída; revisão editorial humana pendente. Seed significa carga inicial de dados. Inseridas 10 questões originais de exemplo e 10 gabaritos no projeto de desenvolvimento clxnqrkdalimrqcnhegr. Todas em draft, versão 1 e target_exam=both: duas de Matemática, Português, Ciências, História e Geografia. Não são questões oficiais ou validadas pela ETEC/IF.

## Arquivos e funcionamento

- supabase/seed.sql: fonte executável do lote; somente inserções de dados não sensíveis.
- supabase/config.toml: db.seed habilitado com ./seed.sql para futuras cargas locais após migrations.
- supabase/tests/verify_seed.sql: cinco verificações de leitura sobre os IDs do lote.
- scripts/test-seed.mjs: teste de repetição pelo comando npm run test:seed.
- [REVISAO-SEED.md](REVISAO-SEED.md): enunciados, alternativas, gabaritos e explicações para revisão humana interna.

IDs estáveis terminados de 000000000001 até 000000000010, com prefixo d1090000-0000-4000-8000. Uma única instrução insere questões e gabaritos atomicamente. Repetir não duplica nem atualiza registros existentes. Gabaritos são inseridos somente para questões criadas naquela execução: um ID existente não recebe resposta potencialmente incompatível. Se faltar gabarito em registro existente, investigar a falha de verificação, sem sobrescrever os dados.

Não há DELETE, TRUNCATE, alterações de permissões, usuários, senhas, tokens ou dados pessoais reais no seed. Nenhuma nova migration: a estrutura não mudou. As duas migrations anteriores continuam oficiais. Essa separação segue a [documentação de seeds do Supabase](https://supabase.com/docs/guides/local-development/seeding-your-database).

seed.sql e o documento de revisão contêm gabaritos de exemplos no repositório local. Não importar pelo frontend, colocar em public/ ou servir por uma rota. Questões reais confidenciais não devem ser usadas como fixtures públicas.

## Testar no PowerShell

Execute um comando por vez:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_seed.sql
npm.cmd run test:seed
npm.cmd run test:questions
```

Esperado: cinco passed=true; seed_repeat_preserves_all_rows com passed=true; três testes Node da API aprovados. Não precisa iniciar o site. CLI autenticada e internet são necessárias; test:questions também lê .env.local.

O teste de repetição simula edição de assunto, status e explicação dentro de uma transação, registra um resumo de todas as linhas e executa o seed duas vezes. Exige que nenhuma linha ou timestamp seja alterado. ROLLBACK desfaz as edições de teste. SQL temporário fica em supabase/.temp, ignorado pelo Git, e é removido ao terminar. Usar no desenvolvimento; não é revisão pedagógica.

Se houver erro ou passed=false, não use reset nem apague dados. Envie a mensagem sem credenciais. A checagem de draft/versão 1 é específica desta etapa: depois de uma revisão/publicação autorizada, atualizar esse critério conscientemente.

## Carga realizada e resultados

Executado nesta etapa, no projeto vinculado, sem reset:

```powershell
npx.cmd --no-install supabase db query --linked --file supabase/seed.sql
```

Não precisa repetir para testar. Em outro ambiente, conferir o vínculo e aplicar migrations antes da carga. Em futura stack local, a CLI usará db.seed após as migrations. Docker continua indisponível: a carga automática local não foi testada. Nenhum config push realizado; não executar db reset --linked.

Cinco checagens de conteúdo passaram antes e depois do teste de repetição; preservação de linhas aprovada; três testes da API pública e lint aprovados. A versão inicial do teste em PowerShell foi bloqueada pela política de execução e substituída por Node. Nenhuma política do Windows alterada. Sem novas dependências, rotas ou variáveis de ambiente. Build não repetido, pois o código da aplicação não mudou.

A conferência técnica não substitui avaliação humana. Lote gerado com auxílio de IA, inteiramente em draft. Abra REVISAO-SEED.md e indique correções pelo número. Aprovar o funcionamento do seed não publica o conteúdo; não há promoção automática a reviewed/published.

Critério técnico cumprido: carga reproduzível, 10 pares completos, duas questões por matéria, proteção da API preservada e repetição sem sobrescrita. Próxima etapa: 10 — tentativa anônima, após seu teste. A seleção pública deverá usar apenas conteúdo efetivamente revisado e publicado.
