begin;
set local statement_timeout='30s';
do $test$
declare u uuid:=gen_random_uuid();other_u uuid:=gen_random_uuid();unconfirmed uuid:=gen_random_uuid();
 qid uuid; request_id uuid:=gen_random_uuid();first_q jsonb;second_q jsonb;third_q jsonb;repeat_q jsonb;state jsonb;resumed jsonb;
 sim uuid:=gen_random_uuid(); seen_ids uuid[]:='{}'; prior_ids uuid[];i int;s text;feedback jsonb;
begin
 insert into auth.users(id,email_confirmed_at) values(u,now()),(other_u,now()),(unconfirmed,null);
 foreach s in array array['matematica','portugues','ciencias','historia','geografia'] loop
  for i in 1..case when s='matematica' then 6 else 2 end loop
   qid:=gen_random_uuid();
   insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status)
   values(qid,'Fixture de seleção','1','2','3','4','5',s,'__selection43__','hard','both','published');
   insert into public.question_answers(question_id,correct_answer,explanation) values(qid,'B','Explicação do snapshot');
  end loop;
 end loop;
 insert into private.simulations(id,title,question_count,subject,published,free_access) values(sim,'Fixture rápido',10,null,true,true);
 first_q:=public.start_question_practice_request(u,'matematica','__selection43__','hard','etec',null,request_id);
 if first_q ? 'correctAnswer' or first_q ? 'explanation' then raise exception 'Resposta exposta';end if;
 if public.start_question_practice_request(u,'matematica','__selection43__','hard','etec',null,request_id)<>first_q then raise exception 'Retry criou outra questão';end if;
 if (select count(*) from private.practice_attempts where user_id=u)<>1 then raise exception 'Consumo duplicado';end if;
 second_q:=public.start_question_practice(u,'matematica','__selection43__','hard','etec',(first_q->>'questionId')::uuid);
 if first_q->>'questionId'=second_q->>'questionId' then raise exception 'Não priorizou inédita';end if;
 prior_ids:=array[(first_q->>'questionId')::uuid,(second_q->>'questionId')::uuid];
 state:=public.start_simulation(u,sim);
 if jsonb_array_length(state->'quiz'->'questions')<>10 or state::text like '%correctAnswer%' or state::text like '%Explicação do snapshot%' then raise exception 'Projeção de simulado';end if;
 if (select count(distinct q->>'id') from jsonb_array_elements(state->'quiz'->'questions') q)<>10 then raise exception 'Duplicação no simulado';end if;
 if exists(select 1 from jsonb_array_elements(state->'quiz'->'questions') q where (q->>'id')::uuid=any(prior_ids)) then raise exception 'Simulado ignorou prática anterior';end if;
 resumed:=public.start_simulation(u,sim);if resumed<>state then raise exception 'Não retomou simulado aberto';end if;
 seen_ids:=prior_ids||(select array_agg((q->>'id')::uuid) from jsonb_array_elements(state->'quiz'->'questions') q where q->>'subject'='matematica');
 for i in 1..2 loop
  third_q:=public.start_question_practice(u,'matematica','__selection43__','hard','etec',null);
  if (third_q->>'questionId')::uuid=any(seen_ids) then raise exception 'Prática ignorou histórico cruzado';end if;
  seen_ids:=array_append(seen_ids,(third_q->>'questionId')::uuid);
 end loop;
 if cardinality(seen_ids)<>6 then raise exception 'Pool não percorrido';end if;
 repeat_q:=public.start_question_practice(u,'matematica','__selection43__','hard','etec',(third_q->>'questionId')::uuid);
 if repeat_q is null or not ((repeat_q->>'questionId')::uuid=any(seen_ids)) then raise exception 'Repetição após pool não permitida';end if;
 if repeat_q->>'questionId'=third_q->>'questionId' then raise exception 'Repetiu a anterior sem necessidade';end if;
 if repeat_q ? 'repeated' or repeat_q ? 'seen' or repeat_q ? 'warning' then raise exception 'Aviso adicional de repetição';end if;
 if (select seen from private.study_exposure_counts(u) where question_id=(repeat_q->>'questionId')::uuid)<>2 then raise exception 'Frequência não calculada';end if;
 -- Conta independente não herda as exposições da primeira.
 if exists(select 1 from private.study_exposure_counts(other_u)) then raise exception 'Histórico cruzou contas';end if;
 if private.start_question_practice(other_u,'matematica','__selection43__','hard','if',null) is null then raise exception 'Filtro both ignorado';end if;
 if private.start_question_practice(other_u,'matematica','__selection43__','easy','if',null) is not null then raise exception 'Filtro dificuldade ignorado';end if;
 -- O snapshot aberto continua válido após alteração de conteúdo ao vivo.
 update public.questions set statement='Fixture alterada',version=version+1 where id=(first_q->>'questionId')::uuid;
 update public.question_answers set correct_answer='C',explanation='Nova explicação' where question_id=(first_q->>'questionId')::uuid;
 feedback:=public.answer_question_practice(u,(first_q->>'id')::uuid,'B');
 if not (feedback->>'correct')::boolean or feedback->>'explanation'<>'Explicação do snapshot' then raise exception 'Correção perdeu snapshot';end if;
 if public.answer_question_practice(u,(first_q->>'id')::uuid,'B')<>feedback then raise exception 'Correção não idempotente';end if;
 begin perform private.start_question_practice(unconfirmed,'matematica','__selection43__','hard','all',null);raise exception 'unconfirmed_accepted';
 exception when others then if sqlerrm<>'login_required' then raise;end if;end;
 if has_function_privilege('anon','private.study_exposure_counts(uuid)','execute')
 or has_function_privilege('authenticated','private.study_exposure_counts(uuid)','execute')
 or has_function_privilege('service_role','private.study_exposure_counts(uuid)','execute') then raise exception 'Privilégios ampliados';end if;
 if position('hashtextextended(p_user_id::text,23)' in pg_get_functiondef('private.start_question_practice(uuid,text,text,text,text,uuid)'::regprocedure))=0
 or position('hashtextextended(p_user_id::text,23)' in pg_get_functiondef('private.start_simulation(uuid,uuid)'::regprocedure))=0 then raise exception 'Trava compartilhada ausente';end if;
end $test$;
select 'history_priority_cross_modes_repeat_resume_privacy' as check_name,true as passed;
rollback;
