begin;
do $$
declare
  quiz jsonb; answers jsonb; wrong_answers jsonb; result jsonb; bad jsonb;
  attempt_uuid uuid; qid uuid; denied boolean; role_name text; command text;
  checks integer := 0;
begin
  -- Publicação transitória, invisível às outras conexões e revertida no final.
  update public.questions set status='published' where id in (
    select ('d1090000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,10)n);
  set local role service_role;
  quiz := public.start_guest_quiz(repeat('d',64));
  if public.read_guest_quiz_result(repeat('d',64)) is not null then raise exception 'Feedback prematuro'; end if;
  checks := checks+1;
  reset role;
  attempt_uuid := (quiz->>'id')::uuid;
  qid := (quiz->'questions'->0->>'id')::uuid;
  select jsonb_agg(jsonb_build_object('questionId',question_id,'answer',correct_answer) order by position)
    into answers from private.guest_quiz_questions where attempt_id=attempt_uuid;
  wrong_answers := jsonb_set(answers,'{0,answer}',to_jsonb(case when answers->0->>'answer'='A' then 'B' else 'A' end));
  -- Mudar o conteúdo vivo não pode mudar a correção nem a explicação do snapshot.
  update public.question_answers set correct_answer=case when correct_answer='A' then 'B' else 'A' end,
    explanation='ALTERADO NO TESTE' where question_id=qid;
  set local role service_role;
  foreach bad in array array[
    'null'::jsonb, '{}'::jsonb, '[]'::jsonb, answers-0,
    jsonb_set(answers,'{0,answer}','"F"'), jsonb_set(answers,'{0,answer}','null'),
    jsonb_set(answers,'{0,questionId}','"not-uuid"'), jsonb_set(answers,'{0,questionId}',answers->1->'questionId'),
    jsonb_set(answers,'{0,questionId}','"00000000-0000-0000-0000-000000000000"'),
    jsonb_set(answers,'{0,score}','10')
  ] loop
    denied:=false;
    begin perform public.submit_guest_quiz(repeat('d',64),bad);
    exception when invalid_parameter_value then denied:=true; end;
    if not denied then raise exception 'Payload inválido aceito: %',bad; end if;
    checks:=checks+1;
  end loop;
  if public.read_guest_quiz_result(repeat('d',64)) is not null then raise exception 'Falha gravou resultado'; end if;
  checks:=checks+1;
  result := public.submit_guest_quiz(repeat('d',64),answers);
  if (result->>'score')::integer <> 10 or (result->>'total')::integer <> 10 or
     jsonb_array_length(result->'questions')<>10 or result::text like '%ALTERADO NO TESTE%' or
     result::text ~ '(token_hash|expires_at)' then raise exception 'Correção/snapshot incorreto'; end if;
  checks:=checks+1;
  if public.read_guest_quiz(repeat('d',64)) is not null then raise exception 'Quiz concluído reaberto'; end if;
  if public.read_guest_quiz_result(repeat('d',64)) <> result then raise exception 'Resultado não persistido'; end if;
  if public.read_guest_quiz_result(repeat('e',64)) is not null then raise exception 'Outro token leu resultado'; end if;
  checks:=checks+3;
  select jsonb_agg(value order by ord desc) into answers from jsonb_array_elements(answers) with ordinality a(value,ord);
  if public.submit_guest_quiz(repeat('d',64),answers) <> result then raise exception 'Retry mudou resultado'; end if;
  checks:=checks+1;
  denied:=false;
  begin perform public.submit_guest_quiz(repeat('d',64),wrong_answers);
  exception when raise_exception then if sqlerrm<>'attempt_already_submitted' then raise; end if; denied:=true; end;
  if not denied then raise exception 'Respostas alteradas após feedback'; end if;
  checks:=checks+1;
  reset role;
  if (select count(*) from private.guest_quiz_results where attempt_id=attempt_uuid)<>1 then raise exception 'Duplicação'; end if;
  update public.guest_quiz_attempts set started_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' where id=attempt_uuid;
  set local role service_role;
  if public.read_guest_quiz_result(repeat('d',64)) is not null then raise exception 'Expiração ignorada'; end if;
  foreach role_name in array array[repeat('d',64),repeat('f',64),'invalid'] loop
    denied:=false;
    begin perform public.submit_guest_quiz(role_name,answers);
    exception when raise_exception then if sqlerrm<>'attempt_unavailable' then raise; end if; denied:=true; end;
    if not denied then raise exception 'Tentativa inválida aceita'; end if;
    checks:=checks+1;
  end loop;
  reset role;
  -- Outra tentativa, um erro: score 9, sem confiar no cliente.
  perform public.start_guest_quiz(repeat('e',64));
  select jsonb_agg(jsonb_build_object('questionId',q.question_id,'answer',case when q.position=1 then
    case when q.correct_answer='A' then 'B' else 'A' end else q.correct_answer end)) into answers
    from private.guest_quiz_questions q join public.guest_quiz_attempts a on a.id=q.attempt_id where a.token_hash=repeat('e',64);
  set local role service_role;
  if (public.submit_guest_quiz(repeat('e',64),answers)->>'score')::integer<>9 then raise exception 'Score parcial incorreto'; end if;
  checks:=checks+1;
  reset role;
  foreach role_name in array array['anon','authenticated','service_role'] loop
    execute format('set local role %I',role_name);
    foreach command in array array['select * from private.guest_quiz_results',
      'update private.guest_quiz_results set feedback=''{}''','delete from private.guest_quiz_results'] loop
      denied:=false;
      begin execute command; exception when insufficient_privilege then denied:=true; end;
      if not denied then raise exception 'Acesso direto: %',role_name; end if;
      checks:=checks+1;
    end loop;
    if role_name<>'service_role' then
      foreach command in array array['select public.submit_guest_quiz(repeat(''d'',64),''[]'')',
        'select public.read_guest_quiz_result(repeat(''d'',64))'] loop
        denied:=false;
        begin execute command; exception when insufficient_privilege then denied:=true; end;
        if not denied then raise exception 'RPC pública: %',role_name; end if;
        checks:=checks+1;
      end loop;
    end if;
    reset role;
  end loop;
  perform set_config('stage12.checks',checks::text,true);
end;
$$;
select 'quiz_correction' as test_suite, current_setting('stage12.checks')::integer as checks_passed, true as passed;
rollback;
