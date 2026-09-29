begin;
do $$
declare u uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid(); a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); result jsonb;
begin
  insert into auth.users(id,email_confirmed_at) values(u,now()),(other_user,now());
  insert into public.guest_quiz_attempts(id,token_hash,started_at,expires_at,completed_at) values
    (a,repeat('4',64),now()-interval '2 hours',now()-interval '1 hour',now()-interval '90 minutes'),
    (b,repeat('5',64),now()-interval '2 hours',now()-interval '1 hour',now()-interval '90 minutes');
  insert into private.guest_quiz_results(attempt_id,answers,feedback,completed_at) values
    (a,'[1,2,3,4,5,6,7,8,9,10]','{"score":7,"total":10}',now()-interval '90 minutes'),
    (b,'[1,2,3,4,5,6,7,8,9,10]','{"score":10,"total":10}',now()-interval '90 minutes');
  insert into private.quiz_result_owners(attempt_id,user_id,saved_at) values(a,u,now()-interval '2 minutes'),(b,u,now()-interval '1 minute');
  set local role service_role;
  result:=public.read_quiz_dashboard(u);
  if (result->>'answered')::integer<>20 or (result->>'correct')::integer<>17 or (result->'latest'->>'id')::uuid<>b then raise exception 'aggregate or order incorrect'; end if;
  if public.read_quiz_dashboard(other_user) <> '{"answered":0,"correct":0,"latest":null}'::jsonb then raise exception 'cross-account read'; end if;
  if public.read_quiz_dashboard(null) <> '{"answered":0,"correct":0,"latest":null}'::jsonb then raise exception 'null identity'; end if;
  reset role;
  if has_function_privilege('anon','public.read_quiz_dashboard(uuid)','execute') or has_function_privilege('authenticated','public.read_quiz_dashboard(uuid)','execute') then raise exception 'public execution'; end if;
end;
$$;
rollback;
select true as dashboard_aggregation_isolation_passed;
