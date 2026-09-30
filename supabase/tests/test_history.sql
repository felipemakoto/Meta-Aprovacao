begin;
do $$
declare u uuid:=gen_random_uuid();other_user uuid:=gen_random_uuid();unconfirmed uuid:=gen_random_uuid();qid uuid:=gen_random_uuid();aid uuid:=gen_random_uuid();quizid uuid:=gen_random_uuid();page1 jsonb;page2 jsonb;c jsonb;d jsonb;i integer;denied boolean;
begin
 insert into auth.users(id,email_confirmed_at) values(u,now()),(other_user,now()),(unconfirmed,null);
 insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
 values(qid,'Histórico fixture','1','2','3','4','5','matematica','__stage20__','easy','both','draft');
 for i in 1..23 loop
  insert into private.practice_attempts(user_id,question_id,snapshot,created_at,expires_at,answer,completed_at)
  values(u,qid,'{"subject":"matematica","topic":"Original","statement":"Snapshot original","options":["1","2","3","4","5"],"correctAnswer":"B","explanation":"Original"}',
    '2026-09-20T12:00:00Z','2026-09-20T12:30:00Z','A','2026-09-20T12:10:00.123456Z');
 end loop;
 insert into private.practice_attempts(id,user_id,question_id,snapshot) values(aid,u,qid,'{}');
 insert into public.guest_quiz_attempts(id,token_hash,started_at,expires_at,completed_at)
 values(quizid,encode(extensions.digest(quizid::text,'sha256'),'hex'),now()-interval '2 hours',now()-interval '1 hour',now()-interval '90 minutes');
 insert into private.guest_quiz_results(attempt_id,answers,feedback,completed_at)
 values(quizid,'[1,2,3,4,5,6,7,8,9,10]','{"score":7,"total":10,"fixture":"stored"}',now()-interval '90 minutes');
 insert into private.quiz_result_owners(attempt_id,user_id) values(quizid,u);
 set local role service_role;
 page1:=public.read_study_history(u,'practice');
 if jsonb_array_length(page1->'items')<>20 or page1->'next'='null'::jsonb then raise exception 'pagination count';end if;
 if page1::text like '%correctAnswer%' or page1::text like '%explanation%' or page1::text like '%statement%' then raise exception 'list leakage';end if;
 c:=page1->'next';
 page2:=public.read_study_history(u,'practice',(c->>'at')::timestamptz,(c->>'id')::uuid);
 if jsonb_array_length(page2->'items')<>3 or page2->'next'<>'null'::jsonb then raise exception 'tied date pagination';end if;
 if exists(select 1 from jsonb_array_elements(page1->'items') a cross join jsonb_array_elements(page2->'items') b where a->>'id'=b->>'id') then raise exception 'duplicate pages';end if;
 if public.read_study_history(other_user,'practice')<>'{"items":[],"next":null}'::jsonb then raise exception 'cross account list';end if;
 if public.read_history_detail(other_user,'practice',(c->>'id')::uuid) is not null or public.read_history_detail(u,'practice',aid) is not null then raise exception 'unauthorized or unfinished review';end if;
 d:=public.read_history_detail(u,'practice',(c->>'id')::uuid);
 if d->>'explanation'<>'Original' or d->>'correctAnswer'<>'B' or (d->>'correct')::boolean then raise exception 'lost snapshot';end if;
 if jsonb_array_length(public.read_study_history(u,'tests')->'items')<>1 or public.read_study_history(other_user,'tests')<>'{"items":[],"next":null}'::jsonb then raise exception 'quiz isolation';end if;
 if public.read_history_detail(other_user,'tests',quizid) is not null or public.read_history_detail(u,'tests',quizid)->>'fixture'<>'stored' then raise exception 'quiz ownership';end if;
 denied:=false;begin perform public.read_study_history(unconfirmed,'tests');exception when raise_exception then denied:=sqlerrm='login_required';end;if not denied then raise exception 'unconfirmed read';end if;
 denied:=false;begin perform public.read_study_history(u,'all');exception when raise_exception then denied:=sqlerrm='invalid_input';end;if not denied then raise exception 'invalid filter';end if;
 denied:=false;begin perform public.read_study_history(u,'practice',now(),null);exception when raise_exception then denied:=sqlerrm='invalid_input';end;if not denied then raise exception 'partial cursor';end if;
 reset role;
 update public.questions set statement='Changed live' where id=qid;
 set local role service_role;
 if public.read_history_detail(u,'practice',(c->>'id')::uuid)->>'statement'<>'Snapshot original' then raise exception 'live edit changed review';end if;
 reset role;
 if has_function_privilege('anon','public.read_study_history(uuid,text,timestamptz,uuid)','execute')
 or has_function_privilege('authenticated','public.read_history_detail(uuid,text,uuid)','execute')
 or has_table_privilege('service_role','private.practice_attempts','select') then raise exception 'unexpected grant';end if;
end;$$;
rollback;
select true as history_pagination_snapshot_isolation_passed;

