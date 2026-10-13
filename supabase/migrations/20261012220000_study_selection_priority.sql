-- Etapa 43: prioriza inéditas; permite repetição silenciosa das menos apresentadas.
-- Histórico de prática, simulados e diagnósticos salvos; sem reset ou aviso de repetição.
create or replace function private.study_exposure_counts(p_user_id uuid)
returns table(question_id uuid,seen bigint,last_seen timestamptz)
language sql stable security definer set search_path='' as $$
 select v.question_id,count(*),max(v.presented_at) from (
  select p.question_id,p.created_at as presented_at from private.practice_attempts p where p.user_id=p_user_id
  union all
  select (s->>'id')::uuid,a.started_at from private.simulation_attempts a
   cross join lateral jsonb_array_elements(a.snapshots) s where a.user_id=p_user_id
  union all
  select q.question_id,a.started_at from private.quiz_result_owners o
   join public.guest_quiz_attempts a on a.id=o.attempt_id
   join private.guest_quiz_questions q on q.attempt_id=a.id where o.user_id=p_user_id
 ) v group by v.question_id;
$$;
create or replace function private.start_question_practice(p_user_id uuid,p_subject text,p_topic text,p_difficulty text,p_exam text,p_previous uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare q record; a private.practice_attempts%rowtype;
begin
  if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required'; end if;
  if p_subject is null or p_subject not in ('matematica','portugues','ciencias','historia','geografia')
    or p_difficulty is null or p_difficulty not in ('all','easy','medium','hard')
    or p_exam is null or p_exam not in ('all','etec','if') or p_topic is null or char_length(p_topic)>160 then raise exception 'invalid_input'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,23));
  -- Serializa por usuário e limita criação técnica, independentemente de filtros.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,19));
  if (select count(*) from private.practice_attempts where user_id=p_user_id and created_at>clock_timestamp()-interval '1 minute')>=30 then raise exception 'rate_limited'; end if;
  select x.*,y.correct_answer,y.explanation into q from public.questions x join public.question_answers y on y.question_id=x.id
    left join private.study_exposure_counts(p_user_id) e on e.question_id=x.id
    where x.status='published' and x.subject=p_subject and (p_topic='' or x.topic=p_topic)
      and (p_difficulty='all' or x.difficulty=p_difficulty)
      and (p_exam='all' or x.target_exam in (p_exam,'both'))
    order by coalesce(e.seen,0),case when x.id=p_previous then 1 else 0 end,coalesce(e.last_seen,'-infinity'::timestamptz),random() limit 1;
  if not found then return null; end if;
  insert into private.practice_attempts(user_id,question_id,snapshot) values(p_user_id,q.id,
    jsonb_build_object('version',q.version,'subject',q.subject,'topic',q.topic,'statement',q.statement,
      'options',jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),
      'correctAnswer',q.correct_answer,'explanation',q.explanation)) returning * into a;
  return jsonb_build_object('id',a.id,'questionId',a.question_id,'expiresAt',a.expires_at,'subject',q.subject,'topic',q.topic,
    'statement',q.statement,'options',a.snapshot->'options');
end;
$$;
create or replace function private.start_simulation(p_user_id uuid,p_simulation_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s private.simulations%rowtype; a_id uuid; qs jsonb;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,23));
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,21));
 select id into a_id from private.simulation_attempts where user_id=p_user_id and simulation_id=p_simulation_id and completed_at is null and expires_at>clock_timestamp() order by started_at desc limit 1;
 if found then return public.read_simulation(p_user_id,a_id);end if;
 if (select count(*) from private.simulation_attempts where user_id=p_user_id and started_at>clock_timestamp()-interval '1 minute')>=5 then raise exception 'rate_limited';end if;
 select * into s from private.simulations where id=p_simulation_id and published for share;
 if not found then raise exception 'simulation_unavailable';end if;
 -- Uma amostra equilibrada por matéria ou uma única matéria. Publicação é editorial.
 with candidates as (
  select q.*,a.correct_answer,a.explanation,row_number() over(partition by q.subject order by coalesce(e.seen,0),coalesce(e.last_seen,'-infinity'::timestamptz),random()) rank
  from public.questions q join public.question_answers a on a.question_id=q.id
  left join private.study_exposure_counts(p_user_id) e on e.question_id=q.id
  where q.status='published' and (s.subject is null or q.subject=s.subject)
 ), chosen as (
  select *,row_number() over(order by subject,rank) position from candidates where rank<=case when s.subject is null then s.question_count/5 else s.question_count end
 ) select jsonb_agg(jsonb_build_object('id',id,'position',position,'version',version,'subject',subject,'topic',topic,'statement',statement,
  'options',jsonb_build_array(option_a,option_b,option_c,option_d,option_e),'correctAnswer',correct_answer,'explanation',explanation) order by position) into qs from chosen;
 if qs is null or jsonb_array_length(qs)<>s.question_count then raise exception 'simulation_unavailable';end if;
 insert into private.simulation_attempts(user_id,simulation_id,title,snapshots) values(p_user_id,s.id,s.title,qs) returning id into a_id;
 return public.read_simulation(p_user_id,a_id);
end;$$;
-- Os implementadores permanecem inacessíveis aos clientes e à API direta.
revoke all on function private.study_exposure_counts(uuid),private.start_question_practice(uuid,text,text,text,text,uuid),private.start_simulation(uuid,uuid)
 from public,anon,authenticated,service_role;
