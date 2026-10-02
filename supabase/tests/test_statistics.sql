begin;
do $$
declare u uuid:=gen_random_uuid();other_u uuid:=gen_random_uuid();unconfirmed uuid:=gen_random_uuid();qid uuid:=gen_random_uuid();mid uuid:=gen_random_uuid();aid uuid;fb jsonb;qs jsonb;answers jsonb;a jsonb;b jsonb;c jsonb;finished timestamptz;i int;denied boolean;
begin
 insert into auth.users(id,email_confirmed_at) values(u,now()),(other_u,now()),(unconfirmed,null);
 insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status) values(qid,'Fixture privada','1','2','3','4','5','matematica','__stage22__','easy','both','draft');
 insert into private.simulations(id,title,question_count,subject) values(mid,'Fixture',5,'matematica');
 for i in 1..3 loop
  aid:=gen_random_uuid();finished:=case when i=1 then now()-interval '35 days' else now()-interval '1 day' end;
  select jsonb_build_object('id',aid,'completedAt',finished,'total',10,'score',case when i=1 then 7 when i=2 then 8 else 10 end,'questions',jsonb_agg(jsonb_build_object('id',gen_random_uuid(),'position',n,'subject','matematica','correct',n<=case when i=1 then 7 when i=2 then 8 else 10 end))) into fb from generate_series(1,10) n;
  insert into public.guest_quiz_attempts(id,token_hash,started_at,expires_at,completed_at) values(aid,encode(extensions.digest(aid::text,'sha256'),'hex'),finished-interval '10 minutes',finished+interval '20 minutes',finished);
  insert into private.guest_quiz_results values(aid,'[1,2,3,4,5,6,7,8,9,10]',fb,finished);
  -- Diagnóstico antigo associado hoje não entra nos últimos 30 dias. O terceiro não foi associado.
  if i<=2 then insert into private.quiz_result_owners(attempt_id,user_id) values(aid,u);end if;
 end loop;
 for i in 1..5 loop
  finished:=case when i<=3 then now()-interval '1 day' when i=4 then now()-interval '30 days' else now()-interval '30 days'-interval '1 microsecond' end;
  insert into private.practice_attempts(user_id,question_id,snapshot,created_at,expires_at,answer,completed_at)
  values(u,qid,'{"subject":"matematica","correctAnswer":"B"}',finished-interval '10 minutes',finished+interval '20 minutes',case when i in (2,5) then 'A' else 'B' end,finished);
 end loop;
 insert into private.practice_attempts(user_id,question_id,snapshot) values(u,qid,'{}');
 insert into private.practice_attempts(user_id,question_id,snapshot,created_at,expires_at,answer,completed_at) values(u,qid,'{"subject":"matematica","correctAnswer":"B"}',now(),now()+interval '1 day','B',now()+interval '1 hour');
 for i in 1..3 loop
  aid:=gen_random_uuid();finished:=case when i=3 then now()-interval '35 days' else now()-interval '1 day' end;
  select jsonb_build_object('score',case when i=3 then 4 else 3 end,'total',5,'questions',jsonb_agg(jsonb_build_object('subject','matematica','correct',n<=case when i=3 then 4 else 3 end))) into fb from generate_series(1,5) n;
  insert into private.simulation_attempts(id,user_id,simulation_id,title,snapshots,started_at,expires_at,answers,feedback,completed_at) values(aid,u,mid,'Fixture '||i,'[]',finished-interval '10 minutes',finished+interval '1 day','[]',fb,finished);
 end loop;
 insert into private.simulation_attempts(user_id,simulation_id,title,snapshots) values(u,mid,'Incompleta','[]');
 set local role service_role;
 a:=public.read_study_statistics(u,'all');b:=public.read_study_statistics(u,'30d');
 if a->>'answered'<>'40' or a->>'correct'<>'28' or a->>'simulations'<>'3' then raise exception 'all source totals %',a;end if;
 if b->>'answered'<>'24' or b->>'correct'<>'17' or b->>'simulations'<>'2' then raise exception 'window boundary or late association %',b;end if;
 if a::text like '%correctAnswer%' or a::text like '%questions%' or a::text like '%snapshot%' or a::text like '%explanation%' then raise exception 'aggregate leakage';end if;
 if (select sum((s->>'answered')::int) from jsonb_array_elements(a->'subjects') s)<>40 or (select sum((s->>'correct')::int) from jsonb_array_elements(a->'subjects') s)<>28 then raise exception 'subject sums';end if;
 c:=public.read_study_statistics(other_u,'all');if c->>'answered'<>'0' or c->>'simulations'<>'0' or jsonb_array_length(c->'recent')<>0 then raise exception 'owner isolation';end if;
 if public.read_study_statistics(u,'all')<>a then raise exception 'repeat read double count';end if;
 denied:=false;begin perform public.read_study_statistics(unconfirmed,'all');exception when raise_exception then denied:=sqlerrm='login_required';end;if not denied then raise exception 'unconfirmed';end if;
 denied:=false;begin perform public.read_study_statistics(u,'7d');exception when raise_exception then denied:=sqlerrm='invalid_input';end;if not denied then raise exception 'invalid period';end if;
 reset role;
 update public.questions set statement='Live edit',subject='geografia' where id=qid;
 set local role service_role;
 if public.read_study_statistics(u,'all')<>a then raise exception 'live edit changed aggregate';end if;
 reset role;
 for i in 1..6 loop
  insert into private.simulation_attempts(user_id,simulation_id,title,snapshots,started_at,expires_at,answers,feedback,completed_at) values(u,mid,'Older fixture','[]',now()-interval '41 days',now()-interval '39 days','[]','{"score":0,"total":5,"questions":[{"subject":"matematica","correct":false},{"subject":"matematica","correct":false},{"subject":"matematica","correct":false},{"subject":"matematica","correct":false},{"subject":"matematica","correct":false}]}',now()-interval '40 days');
 end loop;
 set local role service_role;
 c:=public.read_study_statistics(u,'all');if c->>'simulations'<>'9' or jsonb_array_length(c->'recent')<>5 then raise exception 'recent bound';end if;
 if public.read_study_statistics(u,'30d')<>b then raise exception 'old additions affected recent window';end if;
 reset role;
 if has_function_privilege('anon','public.read_study_statistics(uuid,text)','execute') or has_function_privilege('authenticated','public.read_study_statistics(uuid,text)','execute') or has_table_privilege('service_role','private.simulation_attempts','select') then raise exception 'unexpected access';end if;
end;$$;
rollback;
select true as statistics_sources_period_snapshot_isolation_passed;
