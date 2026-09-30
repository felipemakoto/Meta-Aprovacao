begin;
do $$
declare u uuid:=gen_random_uuid(); other_user uuid:=gen_random_uuid(); qid uuid:=gen_random_uuid(); q jsonb; feedback jsonb; aid uuid; denied boolean;
begin
  insert into auth.users(id,email_confirmed_at) values(u,now()),(other_user,now());
  -- Publicação somente transacional desta fixture inédita, revertida ao final.
  insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
    values(qid,'Fixture de teste','1','2','3','4','5','matematica','__fixture_stage19__','easy','both','published');
  insert into public.question_answers(question_id,correct_answer,explanation) values(qid,'B','Snapshot original');
  set local role service_role;
  q:=public.start_question_practice(u,'matematica','__fixture_stage19__','easy','etec',null);
  if q is null or q ? 'correctAnswer' or q ? 'explanation' then raise exception 'question leakage'; end if;
  aid:=(q->>'id')::uuid;
  if public.start_question_practice(u,'matematica','__fixture_stage19__','hard','etec',null) is not null then raise exception 'difficulty ignored'; end if;
  denied:=false;
  begin perform public.answer_question_practice(other_user,aid,'B');exception when raise_exception then denied:=sqlerrm='attempt_unavailable';end;
  if not denied then raise exception 'cross account';end if;
  reset role;
  update public.question_answers set correct_answer='A',explanation='Changed' where question_id=qid;
  update public.questions set status='draft' where id=qid;
  set local role service_role;
  if public.start_question_practice(u,'matematica','__fixture_stage19__','easy','if',null) is not null then raise exception 'draft exposed'; end if;
  feedback:=public.answer_question_practice(u,aid,'B');
  if feedback->>'correctAnswer'<>'B' or feedback->>'explanation'<>'Snapshot original' or not (feedback->>'correct')::boolean then raise exception 'snapshot lost'; end if;
  if public.answer_question_practice(u,aid,'B')<>feedback then raise exception 'not idempotent';end if;
  denied:=false;
  begin perform public.answer_question_practice(u,aid,'A');exception when raise_exception then denied:=sqlerrm='already_answered';end;
  if not denied then raise exception 'answer changed';end if;
  reset role;
  update private.practice_attempts set created_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' where id=aid;
  set local role service_role;
  denied:=false;
  begin perform public.answer_question_practice(u,aid,'B');exception when raise_exception then denied:=sqlerrm='attempt_unavailable';end;
  if not denied then raise exception 'expiry ignored';end if;
  reset role;
  insert into private.practice_attempts(user_id,question_id,snapshot)
    select u,qid,'{}'::jsonb from generate_series(1,30);
  set local role service_role;
  denied:=false;
  begin perform public.start_question_practice(u,'matematica','__fixture_stage19__','easy','etec',null);exception when raise_exception then denied:=sqlerrm='rate_limited';end;
  if not denied then raise exception 'rate limit ignored';end if;
  reset role;
  if has_function_privilege('anon','public.start_question_practice(uuid,text,text,text,text,uuid)','execute') or has_function_privilege('authenticated','public.answer_question_practice(uuid,uuid,text)','execute') or has_table_privilege('service_role','private.practice_attempts','select') then raise exception 'unexpected privilege';end if;
end;
$$;
rollback;
select true as practice_snapshot_isolation_filters_passed;
