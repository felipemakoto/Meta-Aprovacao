-- Import display data only, never authorization. Preserve existing profile edits.
create or replace function public.read_account_profile(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb; initial_name text;
begin
 perform private.require_account_user(p_user_id);
 select left(btrim(regexp_replace(coalesce(
   case when jsonb_typeof(raw_user_meta_data->'name')='string' then raw_user_meta_data->>'name' end,
   case when jsonb_typeof(raw_user_meta_data->'full_name')='string' then raw_user_meta_data->>'full_name' end,
   ''),'[[:cntrl:]]','','g')),32) into initial_name from auth.users where id=p_user_id;
 if char_length(initial_name)>=2 then
   insert into private.account_profiles(user_id,nickname) values(p_user_id,initial_name) on conflict(user_id) do nothing;
 end if;
 select jsonb_build_object('nickname',nickname,'reduceMotion',reduce_motion,'avatarVersion',avatar_version,'theme',theme) into result from private.account_profiles where user_id=p_user_id;
 return coalesce(result,jsonb_build_object('nickname','','reduceMotion',false,'avatarVersion',null,'theme','light'));
end$$;
revoke all on function public.read_account_profile(uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_account_profile(uuid) to service_role;
