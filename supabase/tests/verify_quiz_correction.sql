select 'results_rls' as check_name, relrowsecurity as passed from pg_class where oid='private.guest_quiz_results'::regclass
union all
select 'no_direct_table_access', not exists (
  select 1 from unnest(array['anon','authenticated','service_role']) r
  where has_table_privilege(r,'private.guest_quiz_results','SELECT,INSERT,UPDATE,DELETE'))
union all
select 'rpc_server_only', not exists (
  select 1 from unnest(array['anon','authenticated']) r,
  unnest(array['public.submit_guest_quiz(text,jsonb)','public.read_guest_quiz_result(text)']) f
  where has_function_privilege(r,f,'EXECUTE'))
union all
select 'server_rpc_access', has_function_privilege('service_role','public.submit_guest_quiz(text,jsonb)','EXECUTE')
  and has_function_privilege('service_role','public.read_guest_quiz_result(text)','EXECUTE')
union all
select 'restricted_search_path', count(*)=2 and bool_and(prosecdef and proconfig @> array['search_path=""'])
  from pg_proc where oid in ('public.submit_guest_quiz(text,jsonb)'::regprocedure,'public.read_guest_quiz_result(text)'::regprocedure);
