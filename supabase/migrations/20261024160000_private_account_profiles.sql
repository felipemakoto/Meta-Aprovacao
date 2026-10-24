-- Account presentation/preferences only; no authentication, subscriptions or entitlements change.
create table private.account_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 nickname text not null default '' check(char_length(nickname)<=32 and nickname !~ '[[:cntrl:]]'),
 reduce_motion boolean not null default false,
 avatar bytea check(avatar is null or (octet_length(avatar) between 12 and 131072 and substring(avatar from 1 for 4)=decode('52494646','hex') and substring(avatar from 9 for 4)=decode('57454250','hex'))),
 avatar_version uuid,
 check((avatar is null)=(avatar_version is null))
);
alter table private.account_profiles enable row level security;
revoke all on private.account_profiles from public,anon,authenticated,service_role;

create function private.require_account_user(p_user_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
end$$;
revoke all on function private.require_account_user(uuid) from public,anon,authenticated,service_role;

create function public.read_account_profile(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare result jsonb;
begin
 perform private.require_account_user(p_user_id);
 select jsonb_build_object('nickname',nickname,'reduceMotion',reduce_motion,'avatarVersion',avatar_version) into result from private.account_profiles where user_id=p_user_id;
 return coalesce(result,jsonb_build_object('nickname','','reduceMotion',false,'avatarVersion',null));
end$$;

create function public.reserve_account_update(p_user_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp();k text:='account:'||p_user_id::text;
begin
 perform private.require_account_user(p_user_id);
 perform pg_advisory_xact_lock(hashtextextended(k,0));
 if exists(select 1 from private.security_request_budgets where bucket_key=k and expires_at>t and used>=20) then raise exception 'rate_limited';end if;
 insert into private.security_request_budgets values(k,1,t+interval '10 minutes')
 on conflict(bucket_key) do update set used=case when private.security_request_budgets.expires_at<=t then 1 else private.security_request_budgets.used+1 end,
 expires_at=case when private.security_request_budgets.expires_at<=t then excluded.expires_at else private.security_request_budgets.expires_at end;
end$$;

create function public.save_account_profile(p_user_id uuid,p_nickname text,p_reduce_motion boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 perform private.require_account_user(p_user_id);
 if p_nickname is null or p_reduce_motion is null or (char_length(p_nickname)<>0 and char_length(p_nickname) not between 2 and 32) or p_nickname<>btrim(p_nickname) or p_nickname ~ '[[:cntrl:]]' then raise exception 'invalid_input';end if;
 insert into private.account_profiles(user_id,nickname,reduce_motion) values(p_user_id,p_nickname,p_reduce_motion)
 on conflict(user_id) do update set nickname=excluded.nickname,reduce_motion=excluded.reduce_motion;
end$$;

create function public.save_account_avatar(p_user_id uuid,p_image text) returns void language plpgsql security definer set search_path='' as $$
declare image bytea;
begin
 perform private.require_account_user(p_user_id);
 if p_image is not null then
  if char_length(p_image)>174764 or p_image !~ '^[A-Za-z0-9+/]+={0,2}$' then raise exception 'invalid_input';end if;
  image:=decode(p_image,'base64');
  if octet_length(image) not between 12 and 131072 or substring(image from 1 for 4)<>decode('52494646','hex') or substring(image from 9 for 4)<>decode('57454250','hex') then raise exception 'invalid_input';end if;
 end if;
 insert into private.account_profiles(user_id,avatar,avatar_version) values(p_user_id,image,case when image is null then null else gen_random_uuid() end)
 on conflict(user_id) do update set avatar=excluded.avatar,avatar_version=excluded.avatar_version;
end$$;

create function public.read_account_avatar(p_user_id uuid) returns text language plpgsql security definer set search_path='' as $$
declare image bytea;
begin
 perform private.require_account_user(p_user_id);
 select avatar into image from private.account_profiles where user_id=p_user_id;
 return replace(encode(image,'base64'),E'\n','');
end$$;
revoke all on function public.read_account_profile(uuid),public.reserve_account_update(uuid),public.save_account_profile(uuid,text,boolean),public.save_account_avatar(uuid,text),public.read_account_avatar(uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_account_profile(uuid),public.reserve_account_update(uuid),public.save_account_profile(uuid,text,boolean),public.save_account_avatar(uuid,text),public.read_account_avatar(uuid) to service_role;
