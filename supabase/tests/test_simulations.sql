begin;
do $$
declare u uuid:=gen_random_uuid();other_u uuid:=gen_random_uuid();unconfirmed uuid:=gen_random_uuid();math_id uuid:=gen_random_uuid();quick_id uuid:=gen_random_uuid();qid uuid;first_q uuid;attempt uuid;other_attempt uuid;state jsonb;result jsonb;answers jsonb;other_answers jsonb;bad jsonb;s text;i int;denied boolean;history jsonb;page2 jsonb;c jsonb;
begin
 insert into auth.users(id,email_confirmed_at) values(u,now()),(other_u,now()),(unconfirmed,null);
 update private.simulations set published=false;
 -- Isolar fixtures do conteúdo real; todas as alterações são revertidas.
 update public.questions set status='draft' where status='published';
 insert into private.simulations(id,title,question_count,subject,published) values(math_id,'Fixture matemática',20,'matematica',true),(quick_id,'Fixture rápido',10,null,true);
 foreach s in array array['matematica','portugues','ciencias','historia','geografia'] loop
  for i in 1..case when s='matematica' then 20 else 2 end loop
   qid:=gen_random_uuid();
   insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
   values(qid,'Original','1','2','3','4','5',s,'__stage21__','easy','both','published');
   insert into public.question_answers(question_id,correct_answer,explanation) values(qid,'B','Explicação original');
  end loop;
 end loop;
 set local role service_role;
 if jsonb_array_length(public.simulation_catalog(u))<>2 then raise exception 'catalog readiness';end if;
 state:=public.start_simulation(u,math_id);attempt:=(state->'quiz'->>'id')::uuid;
 if jsonb_array_length(state->'quiz'->'questions')<>20 or state::text like '%correctAnswer%' or state::text like '%explanation%' then raise exception 'attempt count or leakage';end if;
 if public.start_simulation(u,math_id)<>state then raise exception 'start idempotency';end if;
 if public.read_simulation(other_u,attempt) is not null then raise exception 'cross owner read';end if;
 if public.read_history_detail(u,'simulations',attempt) is not null then raise exception 'early feedback';end if;
 state:=public.start_simulation(u,quick_id);
 if exists(select 1 from jsonb_array_elements(state->'quiz'->'questions') q group by q->>'subject' having count(*)<>2) then raise exception 'balanced selection';end if;
 select jsonb_agg(jsonb_build_object('questionId',q->>'id','answer','B') order by q->>'id') into answers from jsonb_array_elements(public.read_simulation(u,attempt)->'quiz'->'questions') q;
 denied:=false;begin perform public.submit_simulation(other_u,attempt,answers);exception when raise_exception then denied:=sqlerrm='attempt_unavailable';end;if not denied then raise exception 'cross owner submit';end if;
 denied:=false;begin perform public.submit_simulation(unconfirmed,attempt,answers);exception when raise_exception then denied:=sqlerrm='login_required';end;if not denied then raise exception 'unconfirmed';end if;
 denied:=false;begin perform public.submit_simulation(u,attempt,answers->0);exception when raise_exception then denied:=sqlerrm='invalid_answers';end;if not denied then raise exception 'invalid body';end if;
 denied:=false;begin perform public.submit_simulation(u,attempt,answers-0);exception when raise_exception then denied:=sqlerrm='invalid_answers';end;if not denied then raise exception 'missing answer';end if;
 bad:=jsonb_set(answers,'{0,answer}','"F"');
 denied:=false;begin perform public.submit_simulation(u,attempt,bad);exception when raise_exception then denied:=sqlerrm='invalid_answers';end;if not denied then raise exception 'invalid letter';end if;
 first_q:=(answers->0->>'questionId')::uuid;
 reset role;
 update public.questions set statement='Changed live',version=version+1 where id=first_q;
 update public.question_answers set correct_answer='A',explanation='Changed live' where question_id=first_q;
 set local role service_role;
 result:=public.submit_simulation(u,attempt,answers);
 if result->>'score'<>'20' or result->>'total'<>'20' or (result->>'durationSeconds')::int<0 or result::text like '%Changed live%' then raise exception 'snapshot correction';end if;
 select jsonb_agg(value order by value->>'questionId' desc) into bad from jsonb_array_elements(answers);
 if public.submit_simulation(u,attempt,bad)<>result then raise exception 'repeat submission';end if;
 bad:=jsonb_set(answers,'{0,answer}','"A"');
 denied:=false;begin perform public.submit_simulation(u,attempt,bad);exception when raise_exception then denied:=sqlerrm='already_submitted';end;if not denied then raise exception 'changed replay';end if;
 if public.simulation_summary(u)<>1 or public.simulation_summary(other_u)<>0 then raise exception 'summary isolation';end if;
 history:=public.read_study_history(u,'simulations');
 if jsonb_array_length(history->'items')<>1 or history::text like '%correctAnswer%' or history::text like '%questions%' then raise exception 'history metadata';end if;
 if public.read_history_detail(u,'simulations',attempt)<>result or public.read_history_detail(other_u,'simulations',attempt) is not null then raise exception 'history ownership';end if;
 reset role;
 update private.simulation_attempts set started_at=now()-interval '2 days',expires_at=now()-interval '1 day' where id=attempt;
 set local role service_role;
 if public.submit_simulation(u,attempt,answers)<>result or public.read_simulation(u,attempt)->'result'<>result then raise exception 'completed result expiry';end if;
 state:=public.start_simulation(other_u,math_id);other_attempt:=(state->'quiz'->>'id')::uuid;
 select jsonb_agg(jsonb_build_object('questionId',q->>'id','answer','B')) into other_answers from jsonb_array_elements(state->'quiz'->'questions') q;
 reset role;
 update private.simulation_attempts set started_at=now()-interval '2 days',expires_at=now()-interval '1 day' where id=other_attempt;
 set local role service_role;
 if public.read_simulation(other_u,other_attempt) is not null then raise exception 'expired read';end if;
 denied:=false;begin perform public.submit_simulation(other_u,other_attempt,other_answers);exception when raise_exception then denied:=sqlerrm='attempt_unavailable';end;if not denied then raise exception 'expired submit';end if;
 state:=public.start_simulation(u,quick_id);
 reset role;
 -- Mesmo timestamp: paginação deve usar UUID para não perder/duplicar registros.
 for i in 1..23 loop
  insert into private.simulation_attempts(user_id,simulation_id,title,started_at,expires_at,snapshots,answers,feedback,completed_at)
  values(other_u,math_id,'Pagination','2026-09-29T11:00:00Z','2026-09-30T11:00:00Z','[]',answers,result,'2026-09-29T12:00:00.123456Z');
 end loop;
 set local role service_role;
 history:=public.read_study_history(other_u,'simulations');c:=history->'next';
 if jsonb_array_length(history->'items')<>20 or c='null'::jsonb then raise exception 'pagination first';end if;
 page2:=public.read_study_history(other_u,'simulations',(c->>'at')::timestamptz,(c->>'id')::uuid);
 if jsonb_array_length(page2->'items')<>3 or page2->'next'<>'null'::jsonb or exists(select 1 from jsonb_array_elements(history->'items') a cross join jsonb_array_elements(page2->'items') b where a->>'id'=b->>'id') then raise exception 'pagination tied date';end if;
 reset role;
 update private.simulations set published=false;
 set local role service_role;
 if public.simulation_catalog(u)<>'[]'::jsonb then raise exception 'draft catalog';end if;
 denied:=false;begin perform public.start_simulation(other_u,quick_id);exception when raise_exception then denied:=sqlerrm='simulation_unavailable';end;if not denied then raise exception 'draft start';end if;
 reset role;
 update private.simulations set published=true where id=math_id;
 update public.questions set status='draft' where id=first_q;
 set local role service_role;
 if public.simulation_catalog(u)<>'[]'::jsonb then raise exception 'insufficient content catalog';end if;
 denied:=false;begin perform public.start_simulation(other_u,math_id);exception when raise_exception then denied:=sqlerrm='simulation_unavailable';end;if not denied then raise exception 'insufficient content start';end if;
 reset role;
 if has_table_privilege('service_role','private.simulation_attempts','select') or has_function_privilege('authenticated','public.submit_simulation(uuid,uuid,jsonb)','execute') or has_function_privilege('anon','public.simulation_catalog(uuid)','execute') or has_function_privilege('service_role','public.read_history_detail_stage20(uuid,text,uuid)','execute') then raise exception 'unexpected privilege';end if;
end;$$;
rollback;
select true as simulation_snapshot_ownership_idempotency_passed;
