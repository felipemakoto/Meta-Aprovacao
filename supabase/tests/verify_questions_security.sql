-- Somente leitura. As seis linhas devem retornar passed=true.
with targets as (
  select c.oid, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname in ('questions', 'question_answers')
    and c.relkind = 'r'
)
select 'both_tables_have_rls' as check_name,
  count(*) = 2 and bool_and(relrowsecurity) as passed from targets
union all
select 'no_client_table_or_column_grants', not exists (
  select 1 from targets t cross join pg_roles r
  where r.rolname in ('anon', 'authenticated') and (
    has_table_privilege(r.oid, t.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    or has_any_column_privilege(r.oid, t.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
  )
)
union all
select 'no_policies_allow_direct_access', not exists (
  select 1 from pg_policy where polrelid in (select oid from targets)
)
union all
select 'service_role_read_only', count(*) = 2 and bool_and(
  has_table_privilege('service_role', oid, 'SELECT')
  and not has_table_privilege('service_role', oid, 'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
  and not has_any_column_privilege('service_role', oid, 'INSERT, UPDATE, REFERENCES')
) from targets
union all
select 'answers_have_question_foreign_key', exists (
  select 1 from pg_constraint
  where conrelid = to_regclass('public.question_answers') and contype = 'f'
    and confrelid = to_regclass('public.questions') and confdeltype = 'r'
)
union all
select 'questions_do_not_contain_answer_fields', not exists (
  select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'questions'
    and column_name in ('correct_answer', 'explanation')
);
