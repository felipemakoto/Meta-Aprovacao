-- Agregados privados por resposta concluída; não exportar snapshots ao navegador.
create function public.read_study_statistics(p_user_id uuid,p_period text default 'all')
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; as_of timestamptz:=now(); since_at timestamptz;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 if p_period is null or p_period not in ('all','30d') then raise exception 'invalid_input';end if;
 since_at:=case when p_period='30d' then as_of-interval '30 days' else '-infinity'::timestamptz end;
 with tests as (
  select r.feedback,r.completed_at from private.quiz_result_owners o join private.guest_quiz_results r on r.attempt_id=o.attempt_id
  where o.user_id=p_user_id and r.completed_at>=since_at and r.completed_at<=as_of
 ), practices as (
  select snapshot,answer from private.practice_attempts where user_id=p_user_id and completed_at is not null and completed_at>=since_at and completed_at<=as_of
 ), simulations as (
  select id,title,feedback,completed_at from private.simulation_attempts where user_id=p_user_id and completed_at is not null and completed_at>=since_at and completed_at<=as_of
 ), responses as (
  select q->>'subject' subject,(q->>'correct')::boolean correct from tests cross join lateral jsonb_array_elements(feedback->'questions') q
  union all
  select snapshot->>'subject',answer=snapshot->>'correctAnswer' from practices
  union all
  select q->>'subject',(q->>'correct')::boolean from simulations cross join lateral jsonb_array_elements(feedback->'questions') q
 ), subjects as (
  select s.subject,count(r.subject) answered,count(r.subject) filter(where r.correct) correct
  from unnest(array['matematica','portugues','ciencias','historia','geografia']) s(subject)
  left join responses r on r.subject=s.subject group by s.subject
 ), recent as (select * from simulations order by completed_at desc,id desc limit 5)
 select jsonb_build_object('period',p_period,'asOf',as_of,'answered',(select count(*) from responses),
  'correct',(select count(*) from responses where correct),'simulations',(select count(*) from simulations),
  'subjects',(select jsonb_agg(jsonb_build_object('subject',subject,'answered',answered,'correct',correct) order by subject) from subjects),
  'recent',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'at',completed_at,'score',feedback->'score','total',feedback->'total') order by completed_at desc,id desc) from recent),'[]'::jsonb)) into result;
 return result;
end;$$;
revoke all on function public.read_study_statistics(uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.read_study_statistics(uuid,text) to service_role;
