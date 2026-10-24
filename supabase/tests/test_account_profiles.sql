do $$
declare a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();unverified uuid:=gen_random_uuid();named uuid:=gen_random_uuid();google_user uuid:=gen_random_uuid();image text:='__AVATAR__';version uuid;n int;denied boolean;role_name text;f text;
begin
 insert into auth.users(id,email_confirmed_at) values(a,clock_timestamp()),(b,clock_timestamp()),(unverified,null);
 if public.read_account_profile(a)<>jsonb_build_object('nickname','','reduceMotion',false,'avatarVersion',null,'theme','light') then raise exception 'account_default';end if;
 insert into auth.users(id,email_confirmed_at,raw_user_meta_data) values
 (named,clock_timestamp(),' {"name":"João Teste"}'::jsonb),
 (google_user,clock_timestamp(),'{"full_name":"Maria Google"}'::jsonb);
 if public.read_account_profile(named)->>'nickname'<>'João Teste' or public.read_account_profile(google_user)->>'nickname'<>'Maria Google' then raise exception 'account_signup_name';end if;
 perform public.save_account_settings(named,'Nome editado',true,'dark');
 if public.read_account_profile(named)->>'nickname'<>'Nome editado' or public.read_account_profile(named)->>'theme'<>'dark' then raise exception 'account_name_overwrite';end if;
 if public.read_account_avatar(a) is not null then raise exception 'account_default_avatar';end if;
 perform public.save_account_settings(a,'Aluno A',true,'dark');
 if public.read_account_profile(a)->>'theme'<>'dark' or public.read_account_profile(b)->>'theme'<>'light' then raise exception 'account_theme_isolation';end if;
 perform public.save_account_profile(b,'Aluno B',false);
 perform public.save_account_avatar(a,image);
 if public.read_account_avatar(a)<>image or public.read_account_avatar(b) is not null then raise exception 'account_avatar_isolation';end if;
 select avatar_version into version from private.account_profiles where user_id=a;
 perform public.save_account_profile(a,'Novo nickname',false);
 if public.read_account_profile(a)->>'theme'<>'dark' then raise exception 'account_legacy_theme_overwrite';end if;
 denied:=false;begin perform public.save_account_settings(a,'Unsafe',false,'admin');exception when raise_exception then denied:=sqlerrm='invalid_input';end;
 if not denied or public.read_account_profile(a)->>'nickname'<>'Novo nickname' then raise exception 'account_invalid_theme';end if;
 if (public.read_account_profile(a)->>'nickname')<>'Novo nickname' or (public.read_account_profile(b)->>'nickname')<>'Aluno B' or public.read_account_avatar(a)<>image then raise exception 'account_update_isolation';end if;
 perform public.save_account_avatar(a,null);
 if public.read_account_avatar(a) is not null or public.read_account_profile(a)->>'avatarVersion' is not null or (public.read_account_profile(a)->>'nickname')<>'Novo nickname' then raise exception 'account_remove_avatar';end if;
 perform public.save_account_avatar(a,image);
 if (public.read_account_profile(a)->>'avatarVersion')::uuid=version then raise exception 'account_avatar_version';end if;
 denied:=false;begin perform public.save_account_avatar(a,'PHN2Zz4=');exception when raise_exception then denied:=sqlerrm='invalid_input';end;
 if not denied then raise exception 'account_unsafe_avatar';end if;
 denied:=false;begin perform public.save_account_profile(unverified,'Unverified',false);exception when raise_exception then denied:=sqlerrm='login_required';end;
 if not denied then raise exception 'account_unverified_access';end if;
 for n in 1..20 loop perform public.reserve_account_update(a);end loop;
 denied:=false;begin perform public.reserve_account_update(a);exception when raise_exception then denied:=sqlerrm='rate_limited';end;
 if not denied then raise exception 'account_rate_limit';end if;
 perform public.reserve_account_update(b);
 foreach role_name in array array['anon','authenticated'] loop
  if has_table_privilege(role_name,'private.account_profiles','select') or has_table_privilege(role_name,'private.account_profiles','update') then raise exception 'account_table_acl';end if;
  foreach f in array array['public.save_account_settings(uuid,text,boolean,text)','public.read_account_profile(uuid)','public.reserve_account_update(uuid)','public.save_account_profile(uuid,text,boolean)','public.save_account_avatar(uuid,text)','public.read_account_avatar(uuid)'] loop
   if has_function_privilege(role_name,f,'execute') then raise exception 'account_rpc_acl';end if;
  end loop;
 end loop;
 if not (select relrowsecurity from pg_class where oid='private.account_profiles'::regclass) then raise exception 'account_rls';end if;
end$$;
select true as account_profiles_sql_passed;
