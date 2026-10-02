begin;
do $$
declare u uuid:=gen_random_uuid(); other_u uuid:=gen_random_uuid(); unconfirmed uuid:=gen_random_uuid(); qid uuid:=gen_random_uuid();
 quick uuid:=gen_random_uuid(); math uuid:=gen_random_uuid(); second_quick uuid:=gen_random_uuid();
 q jsonb; first_q jsonb; state jsonb; usage jsonb; answers jsonb; result jsonb; nonce uuid:=gen_random_uuid(); denied boolean; i int; subject text;
 start_day timestamptz:=((clock_timestamp() at time zone 'America/Sao_Paulo')::date)::timestamp at time zone 'America/Sao_Paulo';
begin
 insert into auth.users(id,email_confirmed_at) values(u,now()),(other_u,now()),(unconfirmed,null);
 update public.questions set status='draft' where status='published';
 update private.simulations set published=false;
 foreach subject in array array['matematica','portugues','ciencias','historia','geografia'] loop
  for i in 1..2 loop
   qid:=gen_random_uuid();
   insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
   values(qid,'Limites','1','2','3','4','5',subject,'__limits__','easy','both','published');
   insert into public.question_answers(question_id,correct_answer,explanation) values(qid,'B','Explicação');
  end loop;
 end loop;
 insert into private.simulations(id,title,question_count,subject,published,free_access)
 values(quick,'Rápido fixture',10,null,true,true),(second_quick,'Segundo rápido',10,null,true,true),(math,'Math fixture',20,'matematica',true,false);
 set local role service_role;
 usage:=public.read_daily_limits(u);
 if usage->'practice'->>'remaining'<>'10' or usage->'simulations'->>'remaining'<>'1' or (usage->>'resetsAt')::timestamptz<>start_day+interval '1 day' then raise exception 'initial quota or timezone';end if;
 if public.start_question_practice(u,'matematica','missing','easy','all',null) is not null then raise exception 'missing content';end if;
 if public.read_daily_limits(u)->'practice'->>'used'<>'0' then raise exception 'empty consumed';end if;
 first_q:=public.start_question_practice_request(u,'matematica','__limits__','easy','all',null,nonce);
 if public.start_question_practice_request(u,'matematica','__limits__','easy','all',null,nonce)<>first_q then raise exception 'retry duplicated';end if;
 denied:=false;begin perform public.start_question_practice_request(u,'ciencias','__limits__','easy','all',null,nonce);exception when raise_exception then denied:=sqlerrm='invalid_input';end;
 if not denied then raise exception 'nonce input changed';end if;
 for i in 2..10 loop perform public.start_question_practice(u,'matematica','__limits__','easy','all',null);end loop;
 if public.read_daily_limits(u)->'practice'->>'used'<>'10' then raise exception 'count not exact';end if;
 if public.start_question_practice_request(u,'matematica','__limits__','easy','all',null,nonce)<>first_q then raise exception 'retry at cap';end if;
 denied:=false;begin perform public.start_question_practice(u,'portugues','__limits__','hard','if',null);exception when raise_exception then denied:=sqlerrm='daily_practice_limit';end;
 if not denied then raise exception 'filters bypass cap';end if;
 result:=public.answer_question_practice(u,(first_q->>'id')::uuid,'B');
 if public.answer_question_practice(u,(first_q->>'id')::uuid,'B')<>result then raise exception 'answer at cap';end if;
 if public.read_daily_limits(other_u)->'practice'->>'used'<>'0' then raise exception 'cross account count';end if;
 denied:=false;begin perform public.read_daily_limits(unconfirmed);exception when raise_exception then denied:=sqlerrm='login_required';end;
 if not denied then raise exception 'unconfirmed quota';end if;
 if jsonb_array_length(public.simulation_catalog(u))<>2 then raise exception 'free catalog';end if;
 denied:=false;begin perform public.start_simulation(u,math);exception when raise_exception then denied:=sqlerrm='simulation_unavailable';end;
 if not denied then raise exception 'nonfree ID bypass';end if;
 state:=public.start_simulation(u,quick);
 if public.start_simulation(u,quick)<>state or public.read_daily_limits(u)->'simulations'->>'used'<>'1' then raise exception 'resume spent quota';end if;
 denied:=false;begin perform public.start_simulation(u,second_quick);exception when raise_exception then denied:=sqlerrm='daily_simulation_limit';end;
 if not denied then raise exception 'second template bypass';end if;
 select jsonb_agg(jsonb_build_object('questionId',x->>'id','answer','B')) into answers from jsonb_array_elements(state->'quiz'->'questions') x;
 result:=public.submit_simulation(u,(state->'quiz'->>'id')::uuid,answers);
 if public.submit_simulation(u,(state->'quiz'->>'id')::uuid,answers)<>result or public.read_history_detail(u,'simulations',(result->>'id')::uuid)<>result then raise exception 'completion or review blocked';end if;
 denied:=false;begin perform public.start_simulation(u,quick);exception when raise_exception then denied:=sqlerrm='daily_simulation_limit';end;
 if not denied then raise exception 'completed restart bypass';end if;
 reset role;
 -- A virada considera o dia de São Paulo; tentativas anteriores continuam no histórico.
 update private.practice_attempts set created_at=start_day-interval '1 microsecond' where user_id=u;
 update private.simulation_attempts set started_at=start_day-interval '1 microsecond' where user_id=u;
 set local role service_role;
 if public.read_daily_limits(u)->'practice'->>'remaining'<>'10' or public.read_daily_limits(u)->'simulations'->>'remaining'<>'1' then raise exception 'previous day counted';end if;
 q:=public.start_question_practice(u,'matematica','__limits__','easy','all',null);
 if public.read_daily_limits(u)->'practice'->>'used'<>'1' then raise exception 'new day failed';end if;
 reset role;
 update private.practice_attempts set created_at=start_day where id=(q->>'id')::uuid;
 if public.read_daily_limits(u)->'practice'->>'used'<>'1' then raise exception 'midnight excluded';end if;
 if has_function_privilege('service_role','private.start_question_practice(uuid,text,text,text,text,uuid)','execute')
  or has_function_privilege('service_role','private.start_simulation(uuid,uuid)','execute')
  or has_function_privilege('anon','public.read_daily_limits(uuid)','execute')
  or has_function_privilege('authenticated','public.start_question_practice_request(uuid,text,text,text,text,uuid,uuid)','execute')
  or has_table_privilege('service_role','private.practice_requests','select') then raise exception 'quota privilege bypass';end if;
end;$$;
rollback;
select true as free_limits_quota_retry_timezone_privileges_passed;
