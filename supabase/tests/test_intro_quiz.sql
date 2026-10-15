do $$
declare first_quiz jsonb; second_quiz jsonb; feedback jsonb; answers jsonb; token1 text:=encode(extensions.gen_random_bytes(32),'hex'); token2 text:=encode(extensions.gen_random_bytes(32),'hex');
 published_before bigint; old_snapshots text; original_statement text; attempt uuid; denied boolean:=false;
begin
 select count(*) into published_before from public.questions where status='published';
 select md5(coalesce(jsonb_agg(to_jsonb(q) order by attempt_id,position)::text,'[]')) into old_snapshots from private.guest_quiz_questions q;
 first_quiz:=public.start_guest_quiz(token1);second_quiz:=public.start_guest_quiz(token2);attempt:=(first_quiz->>'id')::uuid;
 if first_quiz->'questions'<>second_quiz->'questions' or jsonb_array_length(first_quiz->'questions')<>10 then raise exception 'intro_fixed_catalog';end if;
 if first_quiz::text~'correctAnswer|correct_answer|explanation|token_hash' then raise exception 'intro_answer_leak';end if;
 if first_quiz<>public.start_guest_quiz(token1) then raise exception 'intro_idempotency';end if;
 if (select count(*) from private.guest_quiz_questions where attempt_id=attempt and subject='matematica')<>2 then raise exception 'intro_coverage';end if;
 if exists(select 1 from private.intro_quiz_catalog c join public.questions q on q.id=c.question_id where q.status<>'reviewed' or q.difficulty<>'easy') then raise exception 'intro_bank_separation';end if;
 if (select count(*) from public.questions where status='published')<>published_before then raise exception 'intro_published_changed';end if;
 -- Snapshot remains authoritative after source text is edited in this rollback-only test.
 select statement into original_statement from private.guest_quiz_questions where attempt_id=attempt and position=1;
 update public.questions set statement='Texto alterado somente no ensaio.' where id=(first_quiz->'questions'->0->>'id')::uuid;
 if public.read_guest_quiz(token1)->'questions'->0->>'statement'<>original_statement then raise exception 'intro_snapshot_mutated';end if;
 select jsonb_agg(jsonb_build_object('questionId',question_id,'answer',correct_answer) order by position) into answers from private.guest_quiz_questions where attempt_id=attempt;
 feedback:=public.submit_guest_quiz(token1,answers);
 if (feedback->>'score')::int<>10 or public.submit_guest_quiz(token1,answers)<>feedback then raise exception 'intro_correction';end if;
 if public.read_guest_quiz(token1) is not null then raise exception 'intro_completed_reopened';end if;
 begin perform public.submit_guest_quiz(token1,jsonb_set(answers,'{0,answer}','"A"'));exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'intro_changed_submission';end if;
 -- Existing attempts cannot be edited by replacing the introductory catalog.
 if (select md5(coalesce(jsonb_agg(to_jsonb(q) order by attempt_id,position)::text,'[]')) from private.guest_quiz_questions q where attempt_id not in(attempt,(second_quiz->>'id')::uuid))<>old_snapshots then raise exception 'intro_existing_attempts_changed';end if;
 for i in 1..3 loop
  if has_table_privilege((array['anon','authenticated','service_role'])[i],'private.intro_quiz_catalog','SELECT') then raise exception 'intro_catalog_permissions';end if;
 end loop;
 if has_function_privilege('anon','public.start_guest_quiz(text)','EXECUTE') or has_function_privilege('authenticated','public.start_guest_quiz(text)','EXECUTE') then raise exception 'intro_rpc_permissions';end if;
 if not has_function_privilege('service_role','public.start_guest_quiz(text)','EXECUTE') then raise exception 'intro_server_missing';end if;
end;
$$;
select 'intro_sql_passed' as result;
