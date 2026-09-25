-- Somente leitura; cinco linhas passed=true.
with targets as (
  select c.oid, c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where (n.nspname,c.relname) in (('public','guest_quiz_attempts'),('private','guest_quiz_questions'))
), functions as (
  select p.oid, p.prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname in ('start_guest_quiz','read_guest_quiz')
)
select 'both_tables_have_rls' as check_name, count(*)=2 and bool_and(relrowsecurity) as passed from targets
union all
select 'no_direct_client_or_service_table_access', not exists (
  select 1 from targets t cross join pg_roles r where r.rolname in ('anon','authenticated','service_role')
  and (has_table_privilege(r.oid,t.oid,'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    or has_any_column_privilege(r.oid,t.oid,'SELECT, INSERT, UPDATE, REFERENCES'))
)
union all
select 'rpc_restricted_to_server', count(*)=2 and bool_and(
  prosecdef and has_function_privilege('service_role',oid,'EXECUTE')
  and not has_function_privilege('anon',oid,'EXECUTE')
  and not has_function_privilege('authenticated',oid,'EXECUTE')
) from functions
union all
select 'no_policies_release_attempts', not exists (select 1 from pg_policy where polrelid in (select oid from targets))
union all
select 'snapshots_have_foreign_keys',
  (select count(*) from pg_constraint where conrelid=to_regclass('private.guest_quiz_questions') and contype='f')=2;
