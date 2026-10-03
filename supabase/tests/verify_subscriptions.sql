-- Somente leitura; o teste funcional usa fixtures com rollback em test_subscriptions.sql.
select
 (select relrowsecurity from pg_class where oid='private.subscriptions'::regclass) as rls_enabled,
 not exists(select 1 from pg_policy where polrelid='private.subscriptions'::regclass) as no_client_policies,
 not exists (
  select 1 from unnest(array['anon','authenticated','service_role']) role_name,
   unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) command_name
  where has_table_privilege(role_name,'private.subscriptions',command_name)
 ) as no_direct_api_privileges,
 (not has_function_privilege('anon','public.read_subscription_access(uuid)','EXECUTE') and
  not has_function_privilege('authenticated','public.read_subscription_access(uuid)','EXECUTE') and
  has_function_privilege('service_role','public.read_subscription_access(uuid)','EXECUTE')) as server_only_rpc,
 (select count(*) from private.subscriptions) as subscription_rows,
 (select count(*) from public.questions where status='published') as published_questions;
