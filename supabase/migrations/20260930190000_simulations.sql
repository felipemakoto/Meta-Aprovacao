-- Catálogo editorial; exemplos em rascunho não disponibilizam conteúdo.
create table private.simulations (
 id uuid primary key default gen_random_uuid(),
 title text not null check(char_length(title) between 1 and 100),
 question_count integer not null check(question_count between 5 and 100),
 subject text check(subject in ('matematica','portugues','ciencias','historia','geografia')),
 published boolean not null default false,
 check(subject is not null or question_count%5=0)
);
create table private.simulation_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 simulation_id uuid not null references private.simulations(id),
 title text not null,
 started_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null default (clock_timestamp()+interval '24 hours'),
 snapshots jsonb not null check(jsonb_typeof(snapshots)='array'),
 answers jsonb,
 feedback jsonb,
 completed_at timestamptz,
 check(expires_at>started_at),
 check((answers is null)=(completed_at is null) and (feedback is null)=(completed_at is null)),
 check(completed_at is null or completed_at>=started_at)
);
create index simulation_history_idx on private.simulation_attempts(user_id,completed_at desc,id desc) where completed_at is not null;
create index simulation_active_idx on private.simulation_attempts(user_id,simulation_id,started_at desc);
alter table private.simulations enable row level security;
alter table private.simulation_attempts enable row level security;
revoke all on private.simulations,private.simulation_attempts from public,anon,authenticated,service_role;
insert into private.simulations(title,question_count,subject) values('Simulado rápido',10,null),('Matemática',20,'matematica');

create function public.simulation_catalog(p_user_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'count',s.question_count,'subject',s.subject) order by s.question_count,s.title,s.id),'[]'::jsonb)
 from private.simulations s where s.published and not exists(
  select 1 from unnest(case when s.subject is null then array['matematica','portugues','ciencias','historia','geografia'] else array[s.subject] end) sub
  where (select count(*) from public.questions q join public.question_answers a on a.question_id=q.id where q.status='published' and q.subject=sub)<case when s.subject is null then s.question_count/5 else s.question_count end
 ));
end;$$;

create function public.read_simulation(p_user_id uuid,p_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare a private.simulation_attempts%rowtype;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 select * into a from private.simulation_attempts where user_id=p_user_id and id=p_id;
 if not found then return null;end if;
 if a.completed_at is not null then return jsonb_build_object('result',a.feedback);end if;
 if a.expires_at<=now() then return null;end if;
 return jsonb_build_object('quiz',jsonb_build_object('id',a.id,'title',a.title,'startedAt',a.started_at,'expiresAt',a.expires_at,'questionCount',jsonb_array_length(a.snapshots),
  'questions',(select jsonb_agg(value-'correctAnswer'-'explanation' order by (value->>'position')::int) from jsonb_array_elements(a.snapshots))));
end;$$;

create function public.start_simulation(p_user_id uuid,p_simulation_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.simulations%rowtype; a_id uuid; qs jsonb;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,21));
 select id into a_id from private.simulation_attempts where user_id=p_user_id and simulation_id=p_simulation_id and completed_at is null and expires_at>clock_timestamp() order by started_at desc limit 1;
 if found then return public.read_simulation(p_user_id,a_id);end if;
 if (select count(*) from private.simulation_attempts where user_id=p_user_id and started_at>clock_timestamp()-interval '1 minute')>=5 then raise exception 'rate_limited';end if;
 select * into s from private.simulations where id=p_simulation_id and published for share;
 if not found then raise exception 'simulation_unavailable';end if;
 -- Uma amostra equilibrada por matéria ou uma única matéria. Publicação é editorial.
 with candidates as (
  select q.*,a.correct_answer,a.explanation,row_number() over(partition by q.subject order by random()) rank
  from public.questions q join public.question_answers a on a.question_id=q.id
  where q.status='published' and (s.subject is null or q.subject=s.subject)
 ), chosen as (
  select *,row_number() over(order by subject,rank) position from candidates where rank<=case when s.subject is null then s.question_count/5 else s.question_count end
 ) select jsonb_agg(jsonb_build_object('id',id,'position',position,'version',version,'subject',subject,'topic',topic,'statement',statement,
  'options',jsonb_build_array(option_a,option_b,option_c,option_d,option_e),'correctAnswer',correct_answer,'explanation',explanation) order by position) into qs from chosen;
 if qs is null or jsonb_array_length(qs)<>s.question_count then raise exception 'simulation_unavailable';end if;
 insert into private.simulation_attempts(user_id,simulation_id,title,snapshots) values(p_user_id,s.id,s.title,qs) returning id into a_id;
 return public.read_simulation(p_user_id,a_id);
end;$$;

create function public.submit_simulation(p_user_id uuid,p_id uuid,p_answers jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a private.simulation_attempts%rowtype; item jsonb; normalized jsonb; finished timestamptz; result jsonb; n int;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 select * into a from private.simulation_attempts where user_id=p_user_id and id=p_id for update;
 if not found then raise exception 'attempt_unavailable';end if;
 n:=jsonb_array_length(a.snapshots);
 if p_answers is null or jsonb_typeof(p_answers)<>'array' then raise exception 'invalid_answers';end if;
 if jsonb_array_length(p_answers)<>n then raise exception 'invalid_answers';end if;
 for item in select value from jsonb_array_elements(p_answers) loop
  if jsonb_typeof(item)<>'object' then raise exception 'invalid_answers';end if;
  if (select count(*) from jsonb_object_keys(item))<>2 or not(item?&array['questionId','answer'])
    or jsonb_typeof(item->'questionId')<>'string' or jsonb_typeof(item->'answer')<>'string'
    or item->>'answer' !~ '^[A-E]$'
    or not exists(select 1 from jsonb_array_elements(a.snapshots) q where q->>'id'=item->>'questionId') then raise exception 'invalid_answers';end if;
 end loop;
 if (select count(distinct value->>'questionId') from jsonb_array_elements(p_answers))<>n then raise exception 'invalid_answers';end if;
 select jsonb_agg(value order by value->>'questionId') into normalized from jsonb_array_elements(p_answers);
 if a.completed_at is not null then
  if normalized<>a.answers then raise exception 'already_submitted';end if;
  return a.feedback;
 end if;
 finished:=clock_timestamp();
 if a.expires_at<=finished then raise exception 'attempt_unavailable';end if;
 select jsonb_build_object('id',a.id,'title',a.title,'completedAt',finished,'durationSeconds',greatest(0,floor(extract(epoch from finished-a.started_at)))::int,
  'total',n,'score',count(*) filter(where q->>'correctAnswer'=x->>'answer'),
  'questions',jsonb_agg((q-'version')||jsonb_build_object('answer',x->>'answer','correct',q->>'correctAnswer'=x->>'answer') order by (q->>'position')::int)) into result
  from jsonb_array_elements(a.snapshots) q join jsonb_array_elements(normalized) x on q->>'id'=x->>'questionId';
 update private.simulation_attempts set completed_at=finished,answers=normalized,feedback=result where id=a.id;
 return result;
end;$$;

-- Preservar contratos anteriores; ampliar histórico por categoria, sem gabaritos na lista.
create or replace function public.read_study_history(p_user_id uuid,p_kind text,p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 if p_kind is null or p_kind not in ('tests','practice','simulations') or (p_before is null)<>(p_before_id is null) then raise exception 'invalid_input';end if;
 with records as (
  select o.attempt_id id,r.completed_at at,jsonb_build_object('id',o.attempt_id,'at',r.completed_at,'score',r.feedback->'score','total',r.feedback->'total') item
  from private.quiz_result_owners o join private.guest_quiz_results r on r.attempt_id=o.attempt_id where p_kind='tests' and o.user_id=p_user_id
  union all
  select a.id,a.completed_at,jsonb_build_object('id',a.id,'at',a.completed_at,'subject',a.snapshot->>'subject','topic',a.snapshot->>'topic','correct',a.answer=a.snapshot->>'correctAnswer')
  from private.practice_attempts a where p_kind='practice' and a.user_id=p_user_id and a.completed_at is not null
  union all
  select a.id,a.completed_at,jsonb_build_object('id',a.id,'at',a.completed_at,'title',a.title,'score',a.feedback->'score','total',a.feedback->'total','durationSeconds',a.feedback->'durationSeconds')
  from private.simulation_attempts a where p_kind='simulations' and a.user_id=p_user_id and a.completed_at is not null
 ), batch as (select * from records where p_before is null or (at,id)<(p_before,p_before_id) order by at desc,id desc limit 21),
 page as (select * from batch order by at desc,id desc limit 20)
 select jsonb_build_object('items',coalesce((select jsonb_agg(item order by at desc,id desc) from page),'[]'::jsonb),
 'next',case when (select count(*) from batch)>20 then (select jsonb_build_object('at',at,'id',id) from page order by at,id limit 1) else null end) into result;
 return result;
end;$$;
-- Renomear função anterior para preservar a leitura de detalhes já testada.
alter function public.read_history_detail(uuid,text,uuid) rename to read_history_detail_stage20;
create function public.read_history_detail(p_user_id uuid,p_kind text,p_id uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if p_kind='simulations' then
  if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
  return (select feedback from private.simulation_attempts where user_id=p_user_id and id=p_id and completed_at is not null);
 end if;
 return public.read_history_detail_stage20(p_user_id,p_kind,p_id);
end;$$;
create function public.simulation_summary(p_user_id uuid) returns integer
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 return (select count(*)::int from private.simulation_attempts where user_id=p_user_id and completed_at is not null);
end;$$;
revoke all on function public.read_history_detail_stage20(uuid,text,uuid),public.read_history_detail(uuid,text,uuid),public.simulation_catalog(uuid),public.read_simulation(uuid,uuid),public.start_simulation(uuid,uuid),public.submit_simulation(uuid,uuid,jsonb),public.simulation_summary(uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_history_detail(uuid,text,uuid),public.simulation_catalog(uuid),public.read_simulation(uuid,uuid),public.start_simulation(uuid,uuid),public.submit_simulation(uuid,uuid,jsonb),public.simulation_summary(uuid) to service_role;
