-- Leitura privada e paginada; nenhuma nova publicação ou alteração de snapshots.
create index practice_history_idx on private.practice_attempts(user_id,completed_at desc,id desc) where completed_at is not null;
create function public.read_study_history(p_user_id uuid,p_kind text,p_before timestamptz default null,p_before_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required'; end if;
 if p_kind is null or p_kind not in ('tests','practice') or (p_before is null)<>(p_before_id is null) then raise exception 'invalid_input';end if;
 with records as (
  select o.attempt_id id,r.completed_at at,
   jsonb_build_object('id',o.attempt_id,'at',r.completed_at,'score',r.feedback->'score','total',r.feedback->'total') item
  from private.quiz_result_owners o join private.guest_quiz_results r on r.attempt_id=o.attempt_id
  where p_kind='tests' and o.user_id=p_user_id
  union all
  select a.id,a.completed_at,jsonb_build_object('id',a.id,'at',a.completed_at,'subject',a.snapshot->>'subject','topic',a.snapshot->>'topic','correct',a.answer=a.snapshot->>'correctAnswer')
  from private.practice_attempts a where p_kind='practice' and a.user_id=p_user_id and a.completed_at is not null
 ), batch as (
  select * from records where p_before is null or (at,id)<(p_before,p_before_id) order by at desc,id desc limit 21
 ), page as (select * from batch order by at desc,id desc limit 20)
 select jsonb_build_object('items',coalesce((select jsonb_agg(item order by at desc,id desc) from page),'[]'::jsonb),
  'next',case when (select count(*) from batch)>20 then (select jsonb_build_object('at',at,'id',id) from page order by at,id limit 1) else null end) into result;
 return result;
end;$$;
create function public.read_history_detail(p_user_id uuid,p_kind text,p_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 if p_kind='tests' then
  return (select r.feedback from private.quiz_result_owners o join private.guest_quiz_results r on r.attempt_id=o.attempt_id where o.user_id=p_user_id and o.attempt_id=p_id);
 elsif p_kind='practice' then
  return (select jsonb_build_object('id',a.id,'at',a.completed_at,'subject',a.snapshot->>'subject','topic',a.snapshot->>'topic',
   'statement',a.snapshot->>'statement','options',a.snapshot->'options','answer',a.answer,'correctAnswer',a.snapshot->>'correctAnswer',
   'correct',a.answer=a.snapshot->>'correctAnswer','explanation',a.snapshot->>'explanation')
   from private.practice_attempts a where a.user_id=p_user_id and a.id=p_id and a.completed_at is not null);
 else raise exception 'invalid_input';end if;
end;$$;
revoke all on function public.read_study_history(uuid,text,timestamptz,uuid),public.read_history_detail(uuid,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_study_history(uuid,text,timestamptz,uuid),public.read_history_detail(uuid,text,uuid) to service_role;

