-- Teste de integração no banco de desenvolvimento, executado como postgres.
-- Fixtures e concessões temporárias existem apenas nesta transação e são revertidas.
-- Qualquer resultado inesperado levanta erro e reprova a execução.
begin;
set local statement_timeout = '15s';

do $$
declare
  question_uuid uuid;
  role_name text;
  table_name text;
  operation text;
  test_case record;
  denied boolean;
  affected bigint;
  checks integer := 0;
  old_time timestamptz := '2000-01-01T00:00:00Z';
begin
  insert into public.questions (
    statement, option_a, option_b, option_c, option_d, option_e,
    subject, topic, difficulty, target_exam, updated_at
  ) values (
    'Fixture temporária: quanto é 1 + 1?', '1', '2', '3', '4', '5',
    'matematica', 'Adição', 'easy', 'both', old_time
  ) returning id into question_uuid;

  if not exists (select 1 from public.questions where id = question_uuid and status = 'draft' and version = 1) then
    raise exception 'Novas questões devem começar em draft, versão 1';
  end if;
  checks := checks + 1;

  insert into public.question_answers (question_id, correct_answer, explanation, updated_at)
  values (question_uuid, 'B', 'Um mais um são dois.', old_time);

  -- Restrições editoriais, integridade referencial e um único gabarito por questão.
  for test_case in select * from (values
    ('update public.questions set statement = '' '' where id = $1', '23514'),
    ('update public.questions set option_a = '''' where id = $1', '23514'),
    ('update public.questions set option_e = null where id = $1', '23502'),
    ('update public.questions set subject = ''invalida'' where id = $1', '23514'),
    ('update public.questions set topic = '''' where id = $1', '23514'),
    ('update public.questions set difficulty = ''invalida'' where id = $1', '23514'),
    ('update public.questions set target_exam = ''invalido'' where id = $1', '23514'),
    ('update public.questions set status = ''invalido'' where id = $1', '23514'),
    ('update public.questions set version = 0 where id = $1', '23514'),
    ('update public.question_answers set correct_answer = ''F'' where question_id = $1', '23514'),
    ('update public.question_answers set explanation = '' '' where question_id = $1', '23514'),
    ('insert into public.question_answers (question_id, correct_answer, explanation) values (gen_random_uuid(), ''A'', ''Sem questão'')', '23503'),
    ('insert into public.question_answers (question_id, correct_answer, explanation) values ($1, ''A'', ''Duplicado'')', '23505'),
    ('delete from public.questions where id = $1', '23503')
  ) as cases(sql_text, expected_state)
  loop
    denied := false;
    begin
      execute test_case.sql_text using question_uuid;
    exception when others then
      if sqlstate <> test_case.expected_state then raise; end if;
      denied := true;
    end;
    if not denied then raise exception 'Restrição não aplicada: %', test_case.sql_text; end if;
    checks := checks + 1;
  end loop;

  update public.questions set topic = 'Operações básicas' where id = question_uuid;
  update public.question_answers set explanation = 'Somando uma unidade a outra, obtemos duas.' where question_id = question_uuid;
  if not exists (select 1 from public.questions where id = question_uuid and updated_at > old_time)
    or not exists (select 1 from public.question_answers where question_id = question_uuid and updated_at > old_time) then
    raise exception 'updated_at não foi atualizado';
  end if;
  checks := checks + 1;

  -- Mesmo uma questão publicada não pode ser baixada diretamente pelo cliente.
  update public.questions set status = 'reviewed' where id = question_uuid;
  update public.questions set status = 'published' where id = question_uuid;

  foreach role_name in array array['anon', 'authenticated'] loop
    execute format('set local role %I', role_name);
    foreach table_name in array array['questions', 'question_answers'] loop
      foreach operation in array array['select', 'insert', 'update', 'delete'] loop
        denied := false;
        begin
          case operation
            when 'select' then execute format('select * from public.%I', table_name);
            when 'insert' then execute format('insert into public.%I default values', table_name);
            when 'update' then execute format('update public.%I set updated_at = now()', table_name);
            when 'delete' then execute format('delete from public.%I', table_name);
          end case;
        exception when insufficient_privilege then denied := true;
        end;
        if not denied then raise exception 'Acesso indevido: % % %', role_name, operation, table_name; end if;
        checks := checks + 1;
      end loop;
    end loop;
    reset role;
  end loop;

  -- Testa RLS separadamente dos GRANTs. Concessão não é visível fora desta transação.
  grant select, insert, update, delete on public.questions, public.question_answers to anon, authenticated;
  foreach role_name in array array['anon', 'authenticated'] loop
    execute format('set local role %I', role_name);
    foreach table_name in array array['questions', 'question_answers'] loop
      execute format('select count(*) from public.%I', table_name) into affected;
      if affected <> 0 then raise exception 'RLS expôs linhas de % a %', table_name, role_name; end if;
      checks := checks + 1;

      execute format('update public.%I set updated_at = now()', table_name);
      get diagnostics affected = row_count;
      if affected <> 0 then raise exception 'RLS permitiu UPDATE'; end if;
      checks := checks + 1;

      execute format('delete from public.%I', table_name);
      get diagnostics affected = row_count;
      if affected <> 0 then raise exception 'RLS permitiu DELETE'; end if;
      checks := checks + 1;

      denied := false;
      begin
        if table_name = 'questions' then
          insert into public.questions (statement, option_a, option_b, option_c, option_d, option_e, subject, topic, difficulty, target_exam)
          values ('Fixture RLS', 'A', 'B', 'C', 'D', 'E', 'matematica', 'Teste', 'easy', 'etec');
        else
          insert into public.question_answers (question_id, correct_answer, explanation)
          values (gen_random_uuid(), 'A', 'Fixture RLS');
        end if;
      exception when insufficient_privilege then denied := true;
      end;
      if not denied then raise exception 'RLS permitiu INSERT'; end if;
      checks := checks + 1;
    end loop;
    reset role;
  end loop;

  set local role service_role;
  if not exists (select 1 from public.questions where id = question_uuid)
    or not exists (select 1 from public.question_answers where question_id = question_uuid and correct_answer = 'B') then
    raise exception 'Leitura privilegiada não funciona';
  end if;
  checks := checks + 1;
  foreach table_name in array array['questions', 'question_answers'] loop
    denied := false;
    begin
      execute format('delete from public.%I', table_name);
    exception when insufficient_privilege then denied := true;
    end;
    if not denied then raise exception 'service_role possui escrita indevida'; end if;
    checks := checks + 1;
  end loop;
  reset role;

  perform set_config('stage8.checks', checks::text, true);
end;
$$;

select 'questions_behavior' as test_suite,
  current_setting('stage8.checks')::integer as checks_passed,
  true as passed;
rollback;
