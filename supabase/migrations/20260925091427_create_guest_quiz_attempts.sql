-- Tokens aleatórios são gerados no servidor; somente SHA-256 chega ao banco.
create table public.guest_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  completed_at timestamptz,
  check (expires_at > started_at),
  check (completed_at is null or completed_at >= started_at)
);

-- Snapshot privado: a correção futura usará estes dados, não o conteúdo editável.
create table private.guest_quiz_questions (
  attempt_id uuid not null references public.guest_quiz_attempts(id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  question_id uuid not null references public.questions(id) on delete restrict,
  question_version integer not null check (question_version > 0),
  subject text not null,
  topic text not null,
  statement text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 5),
  correct_answer text not null check (correct_answer in ('A', 'B', 'C', 'D', 'E')),
  explanation text not null,
  primary key (attempt_id, position),
  unique (attempt_id, question_id)
);
create index guest_quiz_questions_question_id_idx on private.guest_quiz_questions(question_id);
create index guest_quiz_attempts_expiry_idx on public.guest_quiz_attempts(expires_at);

alter table public.guest_quiz_attempts enable row level security;
alter table private.guest_quiz_questions enable row level security;
revoke all on public.guest_quiz_attempts, private.guest_quiz_questions
  from public, anon, authenticated, service_role;

-- RPCs acessíveis somente ao servidor privilegiado, sem SQL dinâmico.
create function public.read_guest_quiz(p_token_hash text)
returns jsonb language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object(
    'id', a.id, 'startedAt', a.started_at, 'expiresAt', a.expires_at,
    'questionCount', 10,
    'questions', (
      select jsonb_agg(jsonb_build_object(
        'position', q.position, 'id', q.question_id, 'version', q.question_version,
        'subject', q.subject, 'topic', q.topic, 'statement', q.statement, 'options', q.options
      ) order by q.position)
      from private.guest_quiz_questions q where q.attempt_id = a.id
    )
  )
  from public.guest_quiz_attempts a
  where a.token_hash = p_token_hash and a.expires_at > now() and a.completed_at is null;
$$;

create function public.start_guest_quiz(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  attempt_uuid uuid;
  inserted_count integer;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_token_hash' using errcode = '22023';
  end if;
  -- Serializa chamadas com o mesmo identificador, sem bloquear outros visitantes.
  perform pg_advisory_xact_lock(hashtextextended(p_token_hash, 0));
  if exists (select 1 from public.guest_quiz_attempts where token_hash = p_token_hash) then
    -- Expirada/finalizada não é reativada. O servidor deve gerar um novo token.
    return public.read_guest_quiz(p_token_hash);
  end if;

  insert into public.guest_quiz_attempts(token_hash) values (p_token_hash)
  returning id into attempt_uuid;

  insert into private.guest_quiz_questions (
    attempt_id, position, question_id, question_version, subject, topic,
    statement, options, correct_answer, explanation
  )
  select attempt_uuid, (row_number() over (order by subject, rank_in_subject))::smallint,
    id, version, subject, topic, statement,
    jsonb_build_array(option_a, option_b, option_c, option_d, option_e),
    correct_answer, explanation
  from (
    select q.*, a.correct_answer, a.explanation,
      row_number() over (partition by q.subject order by random()) as rank_in_subject
    from public.questions q join public.question_answers a on a.question_id = q.id
    where q.status = 'published'
  ) candidates where rank_in_subject <= 2;
  get diagnostics inserted_count = row_count;
  if inserted_count <> 10 then
    -- A exceção reverte também a tentativa: não deixa registros incompletos.
    raise exception 'quiz_not_ready' using errcode = 'P0001';
  end if;
  return public.read_guest_quiz(p_token_hash);
end;
$$;

revoke all on function public.read_guest_quiz(text), public.start_guest_quiz(text)
  from public, anon, authenticated, service_role;
grant execute on function public.read_guest_quiz(text), public.start_guest_quiz(text) to service_role;

comment on table private.guest_quiz_questions is
  'Cópia preservada do conteúdo e gabarito da tentativa. Sem acesso direto da aplicação. Não atualizar snapshots ao editar questões.';
