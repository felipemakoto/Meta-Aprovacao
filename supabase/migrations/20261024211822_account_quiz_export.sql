-- Saved introductory quiz answers are personal history; never export bearer hashes.
create function public.export_account_quizzes(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare total bigint; rows jsonb;
begin
 perform private.require_account_user(p_user_id);
 select count(*) into total from private.guest_quiz_results r join private.quiz_result_owners o on o.attempt_id=r.attempt_id where o.user_id=p_user_id;
 select coalesce(jsonb_agg(to_jsonb(s)),'[]'::jsonb) into rows from (select r.attempt_id,r.answers,r.completed_at,r.feedback->'score' as score,r.feedback->'total' as total from private.guest_quiz_results r join private.quiz_result_owners o on o.attempt_id=r.attempt_id where o.user_id=p_user_id order by r.completed_at limit 5000) s;
 return jsonb_build_object('total',total,'records',rows,'truncated',total>5000);
end$$;
revoke all on function public.export_account_quizzes(uuid) from public,anon,authenticated,service_role;
grant execute on function public.export_account_quizzes(uuid) to service_role;
