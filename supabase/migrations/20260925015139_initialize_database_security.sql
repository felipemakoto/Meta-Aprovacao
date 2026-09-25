-- Etapa 7: base de permissões. Tabelas de negócio entram em migrations futuras.
-- Não modifica dados, usuários ou objetos internos do Supabase.
create schema if not exists private authorization postgres;

revoke all on schema private from public, anon, authenticated;
revoke create on schema public from public, anon, authenticated;

-- Defaults globais se somam aos defaults por schema. Revogar somente IN SCHEMA
-- não remove, por exemplo, o EXECUTE que PostgreSQL concede a PUBLIC por padrão.
-- Estas regras afetam apenas objetos FUTUROS criados pelo papel postgres.
alter default privileges for role postgres
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema public, private
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public, private
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public, private
  revoke execute on functions from public, anon, authenticated;

-- GRANTs necessários e RLS de cada tabela devem estar na migration que a cria.
