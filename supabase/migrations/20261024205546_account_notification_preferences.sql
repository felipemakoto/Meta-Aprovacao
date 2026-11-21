-- Compatible extension for real in-tab reminders; no email or push service added.
create or replace function public.save_account_preferences(p_user_id uuid,p_preferences jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_account_user(p_user_id);
 if jsonb_typeof(p_preferences)<>'object' or octet_length(p_preferences::text)>4096 or (select count(*) from jsonb_object_keys(p_preferences)) not in(16,20) or not p_preferences ?& array['institution','course','school','examDate','dailyGoal','weekdays','minutes','priorities','difficulty','explanations','fontSize','contrast','density','dashboard','customCount','customMinutes'] then raise exception 'invalid_input';end if;
 if exists(select 1 from jsonb_object_keys(p_preferences) k where k not in('institution','course','school','examDate','dailyGoal','weekdays','minutes','priorities','difficulty','explanations','fontSize','contrast','density','dashboard','customCount','customMinutes','notifyStudy','notifyReview','quietStart','quietEnd')) then raise exception 'invalid_input';end if;
 perform public.reserve_account_update(p_user_id);
 insert into private.account_profiles(user_id,preferences) values(p_user_id,p_preferences) on conflict(user_id) do update set preferences=excluded.preferences;
end$$;

revoke all on function public.save_account_preferences(uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.save_account_preferences(uuid,jsonb) to service_role;
