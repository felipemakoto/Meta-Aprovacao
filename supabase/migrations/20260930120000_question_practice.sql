create table private.practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  snapshot jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null default (clock_timestamp()+interval '30 minutes'),
  answer text check(answer in ('A','B','C','D','E')),
  completed_at timestamptz,
  check(expires_at>created_at),
  check((answer is null)=(completed_at is null))
);
create index practice_attempts_user_idx on private.practice_attempts(user_id,created_at desc);
alter table private.practice_attempts enable row level security;
revoke all on private.practice_attempts from public,anon,authenticated,service_role;

create function public.practice_topics(p_subject text)
returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(topic order by topic),'[]'::jsonb) from (
    select distinct topic from public.questions where status='published' and subject=p_subject order by topic limit 200
  ) t;
$$;

create function public.start_question_practice(p_user_id uuid,p_subject text,p_topic text,p_difficulty text,p_exam text,p_previous uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare q record; a private.practice_attempts%rowtype;
begin
  if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required'; end if;
  if p_subject is null or p_subject not in ('matematica','portugues','ciencias','historia','geografia')
    or p_difficulty is null or p_difficulty not in ('all','easy','medium','hard')
    or p_exam is null or p_exam not in ('all','etec','if') or p_topic is null or char_length(p_topic)>160 then raise exception 'invalid_input'; end if;
  -- Serializa por usuário e limita criação técnica, independentemente de filtros.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,19));
  if (select count(*) from private.practice_attempts where user_id=p_user_id and created_at>clock_timestamp()-interval '1 minute')>=30 then raise exception 'rate_limited'; end if;
  select x.*,y.correct_answer,y.explanation into q from public.questions x join public.question_answers y on y.question_id=x.id
    where x.status='published' and x.subject=p_subject and (p_topic='' or x.topic=p_topic)
      and (p_difficulty='all' or x.difficulty=p_difficulty)
      and (p_exam='all' or x.target_exam in (p_exam,'both'))
    order by case when x.id=p_previous then 1 else 0 end,random() limit 1;
  if not found then return null; end if;
  insert into private.practice_attempts(user_id,question_id,snapshot) values(p_user_id,q.id,
    jsonb_build_object('version',q.version,'subject',q.subject,'topic',q.topic,'statement',q.statement,
      'options',jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),
      'correctAnswer',q.correct_answer,'explanation',q.explanation)) returning * into a;
  return jsonb_build_object('id',a.id,'questionId',a.question_id,'expiresAt',a.expires_at,'subject',q.subject,'topic',q.topic,
    'statement',q.statement,'options',a.snapshot->'options');
end;
$$;

create function public.answer_question_practice(p_user_id uuid,p_attempt_id uuid,p_answer text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare a private.practice_attempts%rowtype;
begin
  if p_answer is null or p_answer not in ('A','B','C','D','E') then raise exception 'invalid_input'; end if;
  select * into a from private.practice_attempts where id=p_attempt_id and user_id=p_user_id for update;
  if not found or a.expires_at<=clock_timestamp() then raise exception 'attempt_unavailable'; end if;
  if a.answer is not null and a.answer<>p_answer then raise exception 'already_answered'; end if;
  if a.answer is null then
    update private.practice_attempts set answer=p_answer,completed_at=clock_timestamp() where id=a.id;
  end if;
  return jsonb_build_object('answer',p_answer,'correct',p_answer=a.snapshot->>'correctAnswer',
    'correctAnswer',a.snapshot->>'correctAnswer','explanation',a.snapshot->>'explanation');
end;
$$;
revoke all on function public.practice_topics(text), public.start_question_practice(uuid,text,text,text,text,uuid), public.answer_question_practice(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.practice_topics(text), public.start_question_practice(uuid,text,text,text,text,uuid), public.answer_question_practice(uuid,uuid,text) to service_role;
