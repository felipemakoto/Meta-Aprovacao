-- Um snapshot consistente: totais e último resultado da mesma conta.
create function public.read_quiz_dashboard(p_user_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  with owned as (
    select o.attempt_id, o.saved_at, r.completed_at,
      (r.feedback->>'score')::integer as score,
      (r.feedback->>'total')::integer as total
    from private.quiz_result_owners o
    join private.guest_quiz_results r on r.attempt_id=o.attempt_id
    where o.user_id=p_user_id
  )
  select jsonb_build_object(
    'answered', coalesce(sum(total),0), 'correct', coalesce(sum(score),0),
    'latest', (select jsonb_build_object('id',attempt_id,'completedAt',completed_at,'score',score,'total',total)
      from owned order by saved_at desc,attempt_id limit 1)
  ) from owned;
$$;
revoke all on function public.read_quiz_dashboard(uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_quiz_dashboard(uuid) to service_role;
