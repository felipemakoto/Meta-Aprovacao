-- Additive and compatible with existing profile clients; no plan/auth fields are writable.
alter table private.account_profiles add column theme text not null default 'light' check(theme in('light','dark','system'));
create or replace function public.read_account_profile(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_account_user(p_user_id);
 select jsonb_build_object('nickname',nickname,'reduceMotion',reduce_motion,'avatarVersion',avatar_version,'theme',theme) into result from private.account_profiles where user_id=p_user_id;
 return coalesce(result,jsonb_build_object('nickname','','reduceMotion',false,'avatarVersion',null,'theme','light'));
end$$;
create function public.save_account_settings(p_user_id uuid,p_nickname text,p_reduce_motion boolean,p_theme text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_account_user(p_user_id);
 if p_theme is null or p_theme not in('light','dark','system') then raise exception 'invalid_input';end if;
 perform public.save_account_profile(p_user_id,p_nickname,p_reduce_motion);
 update private.account_profiles set theme=p_theme where user_id=p_user_id;
end$$;
revoke all on function public.save_account_settings(uuid,text,boolean,text) from public,anon,authenticated,service_role;
grant execute on function public.save_account_settings(uuid,text,boolean,text) to service_role;
