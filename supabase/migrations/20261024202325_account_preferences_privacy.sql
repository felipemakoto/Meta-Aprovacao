-- Additive preferences. RPCs are restricted to the verified server DAL.
alter table private.account_profiles add column preferences jsonb not null default '{}' check(jsonb_typeof(preferences)='object' and octet_length(preferences::text)<=4096);
create function public.read_account_preferences(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.require_account_user(p_user_id);return coalesce((select preferences from private.account_profiles where user_id=p_user_id),'{}'::jsonb);end$$;
create function public.save_account_preferences(p_user_id uuid,p_preferences jsonb) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_account_user(p_user_id);
 if jsonb_typeof(p_preferences)<>'object' or octet_length(p_preferences::text)>4096 or (select count(*) from jsonb_object_keys(p_preferences))<>16 or not p_preferences ?& array['institution','course','school','examDate','dailyGoal','weekdays','minutes','priorities','difficulty','explanations','fontSize','contrast','density','dashboard','customCount','customMinutes'] then raise exception 'invalid_input';end if;
 if exists(select 1 from jsonb_object_keys(p_preferences) k where k not in('institution','course','school','examDate','dailyGoal','weekdays','minutes','priorities','difficulty','explanations','fontSize','contrast','density','dashboard','customCount','customMinutes')) then raise exception 'invalid_input';end if;
 perform public.reserve_account_update(p_user_id);
 insert into private.account_profiles(user_id,preferences) values(p_user_id,p_preferences) on conflict(user_id) do update set preferences=excluded.preferences;
end$$;
create function public.account_security_summary(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin perform private.require_account_user(p_user_id);return jsonb_build_object('sessions',coalesce((select jsonb_agg(jsonb_build_object('createdAt',created_at,'expiresAt',not_after)) from auth.sessions where user_id=p_user_id),'[]'::jsonb));end$$;
-- One transaction: financial guard, lock, personal data cascades and session revocation.
-- Never delete a buyer's records before the provider/retention workflow is confirmed.
create function public.delete_unbilled_account(p_user_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform private.require_account_user(p_user_id);
 perform 1 from auth.users where id=p_user_id for update;
 if exists(select 1 from private.subscriptions where user_id=p_user_id) or exists(select 1 from private.checkout_intents where user_id=p_user_id) or exists(select 1 from private.direct_checkout_attempts where user_id=p_user_id) then raise exception 'subscription_review_required';end if;
 if exists(select 1 from storage.objects where owner_id=p_user_id::text) then raise exception 'deletion_unavailable';end if;
 delete from auth.users where id=p_user_id;
 if exists(select 1 from auth.users where id=p_user_id) or exists(select 1 from auth.sessions where user_id=p_user_id) then raise exception 'deletion_unavailable';end if;
 return true;
end$$;
create function public.export_account_data(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb:='{}';t text;cols text;rows jsonb;total bigint;
begin
 perform private.require_account_user(p_user_id);
 perform public.reserve_account_update(p_user_id);
 foreach t in array array['account_profiles','practice_attempts','simulation_attempts','study_profiles','study_sessions','study_repetition','study_repetition_log','subscriptions','quiz_result_owners'] loop
  execute format('select count(*) from private.%I where user_id=$1',t) into total using p_user_id;
  cols:=case t
   when 'account_profiles' then 'nickname,reduce_motion,avatar_version,theme,preferences'
   when 'practice_attempts' then 'id,question_id,created_at,expires_at,answer,completed_at'
   when 'simulation_attempts' then 'id,simulation_id,title,started_at,expires_at,answers,completed_at,feedback->''score'' as score,feedback->''total'' as total'
   when 'study_profiles' then 'config,updated_at'
   when 'study_sessions' then 'id,title,study_date,start_time,minutes,subject,topic,kind,goal,reminder_minutes,completed_at,archived,source,updated_at'
   when 'study_repetition' then 'question_id,mode,interval_days,ease,repetitions,due_at,reviewed_at'
   when 'study_repetition_log' then 'id,question_id,mode,rating,reviewed_at,due_at'
   when 'subscriptions' then 'provider,external_subscription_id,external_product_id,external_plan_id,provider_status,access_state,access_from,access_until,last_verified_order_id,last_verified_at'
   when 'quiz_result_owners' then 'attempt_id,saved_at'
  end;
  execute format('select coalesce(jsonb_agg(to_jsonb(s)),''[]'') from (select %s from private.%I where user_id=$1 limit 5000) s',cols,t) into rows using p_user_id;
  result:=result||jsonb_build_object(t,jsonb_build_object('total',total,'records',rows,'truncated',total>5000));
 end loop;
 if octet_length(result::text)>8388608 then raise exception 'export_limit_requires_support';end if;
 return result;
end$$;
revoke all on function public.read_account_preferences(uuid),public.save_account_preferences(uuid,jsonb),public.account_security_summary(uuid),public.delete_unbilled_account(uuid),public.export_account_data(uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_account_preferences(uuid),public.save_account_preferences(uuid,jsonb),public.account_security_summary(uuid),public.delete_unbilled_account(uuid),public.export_account_data(uuid) to service_role;
create function public.simulation_previews(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare catalog jsonb;
begin
 perform private.require_account_user(p_user_id);
 catalog:=private.simulation_catalog(p_user_id);
 return (select coalesce(jsonb_agg(item),'[]'::jsonb) from jsonb_array_elements(catalog) item join private.simulations s on s.id=(item->>'id')::uuid where not s.free_access);
end$$;
revoke all on function public.simulation_previews(uuid) from public,anon,authenticated,service_role;
grant execute on function public.simulation_previews(uuid) to service_role;
create function public.save_account_appearance(p_user_id uuid,p_theme text,p_reduce_motion boolean) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform private.require_account_user(p_user_id);
 if p_theme is null or p_theme not in('light','dark','system') or p_reduce_motion is null then raise exception 'invalid_input';end if;
 perform public.reserve_account_update(p_user_id);
 insert into private.account_profiles(user_id,theme,reduce_motion) values(p_user_id,p_theme,p_reduce_motion) on conflict(user_id) do update set theme=excluded.theme,reduce_motion=excluded.reduce_motion;
 return public.read_account_profile(p_user_id);
end$$;
revoke all on function public.save_account_appearance(uuid,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.save_account_appearance(uuid,text,boolean) to service_role;
