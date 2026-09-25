# Migrations — etapa 7

Status: etapa 7 concluída e teste confirmado pelo usuário. CLI autenticada, projeto vinculado e migration 20260925015139 aplicada e verificada no Supabase. A etapa 8 também adicionou 20260925085403; detalhes e testes em [QUESTOES.md](QUESTOES.md).

## O que foi preparado

- Supabase CLI 2.117.0 instalada como dependência de desenvolvimento, com versão fixa no npm.
- supabase/config.toml gerado pela CLI; exposição automática de tabelas e seed local desativados. Esse arquivo configura o ambiente local e não foi enviado ao serviço remoto.
- supabase/migrations/20260925015139_initialize_database_security.sql: primeira migration de permissões, aplicada no projeto clxnqrkdalimrqcnhegr.
- supabase/tests/verify_security_baseline.sql: consulta somente de leitura; após a aplicação, quatro verificações devem retornar passed=true.
- supabase/.gitignore exclui arquivos temporários e de vínculo da CLI.

O prefixo numérico da migration é o horário UTC gerado pela CLI. Pode estar no dia seguinte ao calendário local de São Paulo.

## Efeito da primeira migration

Cria o schema private, sem acesso de anon ou authenticated. Impede esses papéis de criar objetos no schema public. Remove permissões padrão de PUBLIC, anon e authenticated em futuras tabelas, sequências e funções criadas por postgres, globalmente e nos schemas public/private. Objetos futuros exigirão GRANTs explícitos.

No PostgreSQL, defaults por schema se somam aos globais; revogar EXECUTE somente IN SCHEMA não remove o acesso global padrão de PUBLIC. Por isso a migration trata ambos. Não remove permissões de funções existentes nem modifica dados ou tabelas internas de Auth/Storage.

As tabelas de questões e o gabarito protegido pertencem à etapa 8. Cada migration que criar tabela também deve definir RLS e permissões; o RLS automático do painel não substitui essa definição versionada. O schema private não deve ser incluído nos schemas expostos pela Data API.

## Login da CLI (concluído; referência para outra máquina)

Em um PowerShell:

```powershell
Set-Location 'C:\Users\felip\OneDrive\Documentos\projeto_etec-if'
npx.cmd --no-install supabase login
```

Concluir a autorização no navegador e, se solicitado, digitar o código apenas no terminal. Esse login autoriza a CLI a usar a Management API da conta. Não enviar tokens, senha do banco ou códigos pelo chat. A chave publishable do site não permite executar migrations.

A CLI usa o armazenamento nativo de credenciais quando disponível e pode usar ~/.supabase/access-token como fallback. Não copiar esse arquivo para o projeto ou Git.

## Fluxo após autenticação

O projeto alvo é clxnqrkdalimrqcnhegr (estudos-etec/if). Não criar outro projeto.

```powershell
npx.cmd --no-install supabase link --project-ref clxnqrkdalimrqcnhegr
npx.cmd --no-install supabase migration list --linked
npx.cmd --no-install supabase db push --linked --dry-run --skip-vault
```

Conferir o histórico remoto e as permissões existentes antes de aplicar. A lista deve apresentar apenas a migration nova como pendente. O dry-run lista arquivos; não comprova que o SQL executa corretamente. Se o histórico remoto tiver mudanças desconhecidas, investigar antes de continuar.

Depois da revisão:

```powershell
npx.cmd --no-install supabase db push --linked --skip-vault
npx.cmd --no-install supabase migration list --linked
npx.cmd --no-install supabase db query --linked --file supabase/tests/verify_security_baseline.sql
```

Esperado: versão 20260925015139 nas colunas local e remota e quatro linhas com passed=true. Se a CLI solicitar senha do banco, preenchê-la apenas no prompt local. Não usar --password com senha literal, evitando registro no histórico do terminal.

## Regras de trabalho

1. Criar arquivos com `npx.cmd --no-install supabase migration new nome_da_mudanca`.
2. Revisar o SQL e seus testes antes de aplicar.
3. Aplicar com db push para manter o histórico oficial da CLI.
4. Conferir migration list e as verificações SQL.
5. Salvar o checkpoint Git. Git salva os arquivos, não os dados remotos.

Não editar migrations já aplicadas. Corrigir com uma nova migration. Não executar mudanças estruturais avulsas pelo SQL Editor, não usar migration repair para esconder divergências e não executar db reset --linked no projeto remoto. Não executar config push: o arquivo gerado contém defaults locais, inclusive de email, que não devem substituir a configuração remota.

## Testes e limites atuais

CLI --version, init, migration new, login e link concluídos. projects list confirmou ACTIVE_HEALTHY. Consulta remota confirmou PostgreSQL 17.6 e papel postgres; nenhum objeto de tabela em public/private antes da aplicação. O dry-run listou somente 20260925015139_initialize_database_security.sql; db push aplicou esse arquivo com sucesso. migration list confirmou 20260925015139 nas versões local e remota.

A consulta verify_security_baseline.sql retornou quatro passed=true: schema private existe, clientes não têm acesso a private, clientes não podem criar objetos em public e novos objetos de postgres exigem concessões explícitas. Antes da aplicação, apenas a restrição de criação em public já passava. Nenhuma tabela de negócio foi criada.

Docker não foi encontrado no PATH; nenhuma stack ou teste PostgreSQL local foi executado. O major_version=17 foi confirmado compatível com o remoto. O SQL foi executado e verificado no projeto remoto de desenvolvimento. Código Next.js não mudou nesta etapa; build e lint não foram repetidos.

Executar os comandos da CLI sequencialmente: chamadas simultâneas que inicializam o papel temporário de login produziram uma falha transitória de autenticação; a repetição isolada de migration list passou sem senha adicional. Neste ambiente, usar --file para consultas SQL: uma tentativa com SQL inline não concluiu e foi interrompida, enquanto as consultas por arquivo funcionaram.

Se houver erro de autorização, concluir o login. Se houver divergência de histórico, parar e registrar a mensagem sem credenciais. Não apagar arquivos ou executar reset para forçar o resultado esperado.

## Referências

- [Migrations oficiais](https://supabase.com/docs/guides/deployment/database-migrations)
- [Instalação da CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Autenticação da CLI](https://supabase.com/docs/reference/cli/supabase-login)
- [PostgreSQL: privilégios padrão](https://www.postgresql.org/docs/17/sql-alterdefaultprivileges.html)

Critério de conclusão cumprido: migration versionada, aplicada, histórico sincronizado e quatro verificações aprovadas. Os resultados desta página registram a etapa 7; novas migrations aparecem como linhas adicionais em migration list. Estado atual e próxima etapa em [ESTADO-DO-PROJETO.md](ESTADO-DO-PROJETO.md).
