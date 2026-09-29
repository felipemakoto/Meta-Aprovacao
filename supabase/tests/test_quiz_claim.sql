-- Fixtures isoladas; nenhuma questão é publicada e tudo é revertido.
begin;
do $$
declare
  u1 uuid:=gen_random_uuid(); u2 uuid:=gen_random_uuid(); a uuid:=gen_random_uuid();
  b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); denied boolean; r jsonb;
begin
  insert into auth.users(id,email_confirmed_at) values(u1,now()),(u2,now());
  insert into public.guest_quiz_attempts(id,token_hash,started_at,expires_at,completed_at) values
    (a,repeat('1',64),now()-interval '5 minutes',now()+interval '25 minutes',now()),
    (b,repeat('2',64),now()-interval '2 hours',now()-interval '1 hour',now()),
    (c,repeat('3',64),now()-interval '5 minutes',now()+interval '25 minutes',null);
  insert into private.guest_quiz_results(attempt_id,answers,feedback,completed_at)
    values(a,'[1,2,3,4,5,6,7,8,9,10]','{"fixture":"stage17"}',now()),
          (b,'[1,2,3,4,5,6,7,8,9,10]','{"fixture":"expired"}',now());
  set local role service_role;
  if public.claim_quiz_result(repeat('1',64),u1)<>a then raise exception 'claim failed'; end if;
  if public.claim_quiz_result(repeat('1',64),u1)<>a then raise exception 'idempotency failed'; end if;
  r:=public.read_saved_quiz_result(u1);
  if r is distinct from '{"fixture":"stage17"}'::jsonb then raise exception 'owner read failed'; end if;
  if public.read_saved_quiz_result(u2) is not null then raise exception 'cross-account read'; end if;
  if public.read_guest_quiz_result(repeat('1',64)) is not null then raise exception 'guest access retained'; end if;
  denied:=false;
  begin perform public.submit_guest_quiz(repeat('1',64),'[]');
  exception when raise_exception then denied:=sqlerrm='attempt_unavailable'; end;
  if not denied then raise exception 'guest resubmit after claim'; end if;
  denied:=false;
  begin perform public.claim_quiz_result(repeat('1',64),u2);
  exception when raise_exception then denied:=sqlerrm='attempt_unavailable'; end;
  if not denied then raise exception 'ownership transferred'; end if;
  denied:=false;
  begin perform public.claim_quiz_result(repeat('2',64),u1);
  exception when raise_exception then denied:=sqlerrm='attempt_unavailable'; end;
  if not denied then raise exception 'expired claim'; end if;
  denied:=false;
  begin perform public.claim_quiz_result(repeat('3',64),u1);
  exception when raise_exception then denied:=sqlerrm='attempt_unavailable'; end;
  if not denied then raise exception 'incomplete claim'; end if;
  reset role;
  if (select count(*) from private.quiz_result_owners where attempt_id=a)<>1 then raise exception 'duplicate owner'; end if;
  if has_function_privilege('anon','public.claim_quiz_result(text,uuid)','execute')
    or has_function_privilege('authenticated','public.claim_quiz_result(text,uuid)','execute')
    or has_function_privilege('authenticated','public.read_saved_quiz_result(uuid)','execute')
    or has_function_privilege('anon','public.read_saved_quiz_result(uuid)','execute')
    or has_table_privilege('authenticated','private.quiz_result_owners','select')
    or has_table_privilege('service_role','private.quiz_result_owners','update') then
      raise exception 'unexpected privilege';
  end if;
end;
$$;
rollback;
select true as claim_isolation_expiry_idempotency_passed;
