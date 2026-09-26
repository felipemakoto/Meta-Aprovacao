-- Resultado imutável para a aplicação. Nenhum acesso direto, inclusive service_role.
create table private.guest_quiz_results (
  attempt_id uuid primary key references public.guest_quiz_attempts(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) = 10),
  feedback jsonb not null,
  completed_at timestamptz not null
);
alter table private.guest_quiz_results enable row level security;
revoke all on private.guest_quiz_results from public, anon, authenticated, service_role;

create function public.read_guest_quiz_result(p_token_hash text)
returns jsonb language sql volatile security definer set search_path = ''
as $$
  select r.feedback from private.guest_quiz_results r
  join public.guest_quiz_attempts a on a.id = r.attempt_id
  where a.token_hash = p_token_hash and a.completed_at is not null
    and a.expires_at > clock_timestamp();
$$;

create function public.submit_guest_quiz(p_token_hash text, p_answers jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  attempt public.guest_quiz_attempts%rowtype;
  item jsonb;
  normalized jsonb;
  saved private.guest_quiz_results%rowtype;
  feedback jsonb;
  finished_at timestamptz;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'attempt_unavailable' using errcode = 'P0001';
  end if;
  -- Mesmo token concorre pela mesma linha. Reavaliar prazo APÓS obter o lock.
  select * into attempt from public.guest_quiz_attempts
    where token_hash = p_token_hash for update;
  if not found or attempt.expires_at <= clock_timestamp() then
    raise exception 'attempt_unavailable' using errcode = 'P0001';
  end if;
  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;
  if jsonb_array_length(p_answers) <> 10 then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;
  for item in select value from jsonb_array_elements(p_answers) loop
    if jsonb_typeof(item) <> 'object' then
      raise exception 'invalid_answers' using errcode = '22023';
    end if;
    if not (item ?& array['questionId','answer']) or
       (select count(*) from jsonb_object_keys(item)) <> 2 or
       jsonb_typeof(item->'questionId') <> 'string' or
       jsonb_typeof(item->'answer') <> 'string' or
       (item->>'questionId') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or
       (item->>'answer') !~ '^[A-E]$' then
      raise exception 'invalid_answers' using errcode = '22023';
    end if;
  end loop;
  if (select count(distinct value->>'questionId') from jsonb_array_elements(p_answers)) <> 10 or
     (select count(*) from private.guest_quiz_questions where attempt_id = attempt.id) <> 10 or
     exists (
       select 1 from jsonb_array_elements(p_answers) a where not exists (
         select 1 from private.guest_quiz_questions q
         where q.attempt_id = attempt.id and q.question_id = (a.value->>'questionId')::uuid
       )
     ) then
    raise exception 'invalid_answers' using errcode = '22023';
  end if;
  select jsonb_agg(value order by value->>'questionId') into normalized from jsonb_array_elements(p_answers);
  select * into saved from private.guest_quiz_results where attempt_id = attempt.id;
  if found then
    if saved.answers <> normalized then
      raise exception 'attempt_already_submitted' using errcode = 'P0001';
    end if;
    return saved.feedback;
  end if;
  if attempt.completed_at is not null then
    raise exception 'attempt_unavailable' using errcode = 'P0001';
  end if;
  finished_at := clock_timestamp();
  if attempt.expires_at <= finished_at then
    raise exception 'attempt_unavailable' using errcode = 'P0001';
  end if;
  select jsonb_build_object(
    'id', attempt.id, 'completedAt', finished_at, 'total', 10,
    'score', count(*) filter (where a.value->>'answer' = q.correct_answer),
    'questions', jsonb_agg(jsonb_build_object(
      'id', q.question_id, 'position', q.position, 'subject', q.subject,
      'topic', q.topic, 'statement', q.statement, 'options', q.options,
      'answer', a.value->>'answer', 'correctAnswer', q.correct_answer,
      'correct', a.value->>'answer' = q.correct_answer, 'explanation', q.explanation
    ) order by q.position)
  ) into feedback
  from private.guest_quiz_questions q
  join jsonb_array_elements(normalized) a on (a.value->>'questionId')::uuid = q.question_id
  where q.attempt_id = attempt.id;
  insert into private.guest_quiz_results values (attempt.id, normalized, feedback, finished_at);
  update public.guest_quiz_attempts set completed_at = finished_at where id = attempt.id;
  return feedback;
end;
$$;

revoke all on function public.read_guest_quiz_result(text), public.submit_guest_quiz(text,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.read_guest_quiz_result(text), public.submit_guest_quiz(text,jsonb) to service_role;
