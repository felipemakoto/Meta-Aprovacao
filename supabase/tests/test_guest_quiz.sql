-- Integração no desenvolvimento. Alterações editoriais e tentativas são revertidas.
begin;
set local statement_timeout = '20s';
do $$
<<test_guest_quiz>>
declare
  payload jsonb;
  saved_payload jsonb;
  first_id uuid;
  attempt_id uuid;
  denied boolean;
  role_name text;
  sql_command text;
  checks integer := 0;
  before_count integer;
  snapshot_answer text;
begin
  if (select count(*) from public.questions where id in (
    select ('d1090000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid from generate_series(1,10) n
  )) <> 10 then raise exception 'Aplicar seed antes do teste'; end if;

  update public.questions set status = 'draft' where status = 'published';
  select count(*) into before_count from public.guest_quiz_attempts;
  set local role service_role;
  denied := false;
  begin
    perform public.start_guest_quiz(repeat('a', 64));
  exception when raise_exception then
    if sqlerrm <> 'quiz_not_ready' then raise; end if;
    denied := true;
  end;
  if not denied then raise exception 'Rascunhos foram selecionados'; end if;
  reset role;
  if (select count(*) from public.guest_quiz_attempts) <> before_count then
    raise exception 'Falha deixou tentativa incompleta';
  end if;
  checks := checks + 1;

  -- Publicação SOMENTE dentro da transação de teste, invisível a outras conexões.
  update public.questions set status = 'published' where id in (
    select ('d1090000-0000-4000-8000-' || lpad(n::text,12,'0'))::uuid from generate_series(1,10) n
  );
  set local role service_role;
  denied := false;
  begin perform public.start_guest_quiz('invalid');
  exception when invalid_parameter_value then denied := true;
  end;
  if not denied then raise exception 'Hash inválido aceito'; end if;
  checks := checks + 1;

  payload := public.start_guest_quiz(repeat('a', 64));
  if jsonb_array_length(payload->'questions') <> 10 or (payload->>'questionCount')::integer <> 10 then
    raise exception 'Quantidade incorreta';
  end if;
  if payload::text ~ '(correct_answer|explanation|token_hash)' then raise exception 'Campo privado exposto'; end if;
  checks := checks + 1;
  saved_payload := payload;
  attempt_id := (payload->>'id')::uuid;
  first_id := (payload->'questions'->0->>'id')::uuid;

  if public.start_guest_quiz(repeat('a',64)) <> payload then raise exception 'Repetição criou outra tentativa'; end if;
  if public.read_guest_quiz(repeat('a',64)) <> payload then raise exception 'Retomada divergiu'; end if;
  if public.read_guest_quiz(repeat('b',64)) is not null then raise exception 'Outro token acessou tentativa'; end if;
  checks := checks + 3;
  payload := public.start_guest_quiz(repeat('b',64));
  if payload->>'id' = saved_payload->>'id' then raise exception 'Visitantes compartilharam tentativa'; end if;
  checks := checks + 1;
  reset role;

  if (select count(*) from (select subject from private.guest_quiz_questions q
      where q.attempt_id = test_guest_quiz.attempt_id group by subject having count(*) = 2) counts) <> 5 then
    raise exception 'Distribuição por matéria incorreta';
  end if;
  checks := checks + 1;

  select correct_answer into snapshot_answer from private.guest_quiz_questions q
    where q.attempt_id = test_guest_quiz.attempt_id and q.question_id = first_id;
  update public.questions set statement = 'Conteúdo alterado após início', version = version + 1 where id = first_id;
  update public.question_answers set correct_answer = case when correct_answer = 'A' then 'B' else 'A' end,
    explanation = 'Explicação alterada após início' where question_id = first_id;
  if public.read_guest_quiz(repeat('a',64)) <> saved_payload then raise exception 'Conteúdo histórico mudou'; end if;
  if (select correct_answer from private.guest_quiz_questions q
      where q.attempt_id = test_guest_quiz.attempt_id and q.question_id = first_id) <> snapshot_answer then
    raise exception 'Gabarito histórico mudou';
  end if;
  checks := checks + 1;

  update public.guest_quiz_attempts set started_at = now() - interval '1 hour', expires_at = now() - interval '1 second'
    where id = attempt_id;
  if public.read_guest_quiz(repeat('a',64)) is not null then raise exception 'Tentativa expirada acessível'; end if;
  if public.start_guest_quiz(repeat('a',64)) is not null then raise exception 'Tentativa expirada reativada'; end if;
  checks := checks + 1;
  update public.guest_quiz_attempts set completed_at = now() where token_hash = repeat('b',64);
  if public.read_guest_quiz(repeat('b',64)) is not null then raise exception 'Tentativa concluída acessível'; end if;
  checks := checks + 1;

  foreach role_name in array array['anon', 'authenticated'] loop
    execute format('set local role %I', role_name);
    foreach sql_command in array array[
      'select public.start_guest_quiz(repeat(''c'',64))',
      'select public.read_guest_quiz(repeat(''a'',64))',
      'select * from public.guest_quiz_attempts',
      'insert into public.guest_quiz_attempts(token_hash) values (repeat(''c'',64))',
      'update public.guest_quiz_attempts set completed_at = now()',
      'delete from public.guest_quiz_attempts',
      'select * from private.guest_quiz_questions'
    ] loop
      denied := false;
      begin execute sql_command;
      exception when insufficient_privilege then denied := true;
      end;
      if not denied then raise exception 'Acesso indevido: % %', role_name, sql_command; end if;
      checks := checks + 1;
    end loop;
    reset role;
  end loop;
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where (n.nspname,c.relname) in (('public','guest_quiz_attempts'),('private','guest_quiz_questions'))
      and not c.relrowsecurity) then raise exception 'RLS desabilitado'; end if;
  checks := checks + 1;
  perform set_config('stage10.checks', checks::text, true);
end;
$$;
select 'guest_quiz_behavior' as test_suite, current_setting('stage10.checks')::integer as checks_passed, true as passed;
rollback;
