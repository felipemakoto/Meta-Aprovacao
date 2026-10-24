do $$
declare a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();c uuid:=gen_random_uuid();p jsonb:='{"institution":"etec","course":"Técnico","school":"ETEC","examDate":"2027-01-10","dailyGoal":10,"weekdays":[1,3,5],"minutes":30,"priorities":["matematica"],"difficulty":"medium","explanations":"on_demand","fontSize":"large","contrast":"high","density":"compact","dashboard":"goals","customCount":15,"customMinutes":45}';r jsonb;denied boolean;f text;role_name text;
begin
 insert into auth.users(id,email_confirmed_at) values(a,clock_timestamp()),(b,clock_timestamp()),(c,clock_timestamp());
 perform public.save_account_profile(a,'Aluno',true);
 perform public.save_account_preferences(a,p);
 perform public.save_account_appearance(a,'dark',true);
 if public.read_account_profile(a)->>'nickname'<>'Aluno' or public.read_account_profile(a)->>'theme'<>'dark' then raise exception 'appearance_name_overwrite';end if;
 if public.read_account_preferences(a)<>p or public.read_account_preferences(b)<>'{}'::jsonb or public.read_account_profile(a)->>'nickname'<>'Aluno' then raise exception 'preference_isolation';end if;
 denied:=false;begin perform public.save_account_preferences(a,p||'{"role":"admin"}');exception when raise_exception then denied:=sqlerrm='invalid_input';end;
 if not denied then raise exception 'unvalidated_preferences';end if;
 perform public.save_account_preferences(a,p||'{"notifyStudy":true,"notifyReview":false,"quietStart":"22:00","quietEnd":"08:00"}'::jsonb);
 if public.read_account_preferences(a)->>'quietStart'<>'22:00' then raise exception 'notification_preferences';end if;
 if public.export_account_quizzes(a)->>'total'<>'0' then raise exception 'quiz_export_scope';end if;
 r:=public.export_account_data(a);
 if r#>>'{account_profiles,total}'<>'1' or r::text like '%encrypted_password%' or r::text like '%snapshot%' or (r#>'{account_profiles,records,0}') ? 'avatar' then raise exception 'unsafe_export';end if;
 if jsonb_array_length(public.account_security_summary(b)->'sessions')<>0 then raise exception 'session_isolation';end if;
 insert into private.subscriptions(user_id,provider,external_subscription_id,external_product_id,provider_status) values(b,'cakto','settings-test-'||b::text,'fixture','canceled');
 denied:=false;begin perform public.delete_unbilled_account(b);exception when raise_exception then denied:=sqlerrm='subscription_review_required';end;
 if not denied or not exists(select 1 from auth.users where id=b) then raise exception 'financial_guard';end if;
 insert into auth.sessions(id,user_id,created_at,updated_at) values(gen_random_uuid(),c,clock_timestamp(),clock_timestamp());
 perform public.save_account_profile(c,'Temporario',false);
 if not public.delete_unbilled_account(c) then raise exception 'delete_result';end if;
 if exists(select 1 from auth.users where id=c) or exists(select 1 from auth.sessions where user_id=c) or exists(select 1 from private.account_profiles where user_id=c) then raise exception 'deletion_atomicity';end if;
 foreach role_name in array array['anon','authenticated'] loop
  foreach f in array array['public.read_account_preferences(uuid)','public.save_account_preferences(uuid,jsonb)','public.account_security_summary(uuid)','public.delete_unbilled_account(uuid)','public.export_account_data(uuid)','public.export_account_quizzes(uuid)','public.simulation_previews(uuid)','public.save_account_appearance(uuid,text,boolean)'] loop
   if has_function_privilege(role_name,f,'execute') then raise exception 'settings_rpc_acl';end if;
  end loop;
 end loop;
 if not (select relrowsecurity from pg_class where oid='private.account_profiles'::regclass) then raise exception 'rls_missing';end if;
end$$;
select 'settings_sql_passed' as status;
