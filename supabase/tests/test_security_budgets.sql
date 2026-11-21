do $$
declare network text:=encode(extensions.gen_random_bytes(32),'hex');account text:=encode(extensions.gen_random_bytes(32),'hex');pair text:=encode(extensions.gen_random_bytes(32),'hex');
 u uuid:=gen_random_uuid();free_u uuid:=gen_random_uuid();lease_id uuid;next_lease uuid;n int;denied boolean;f text;r text;
begin
 for r in select unnest(array['anon','authenticated']) loop
  foreach f in array array['public.reserve_login_attempt(text,text,text)','public.reserve_document_verification(uuid)','public.release_document_verification(uuid,uuid)'] loop
   if has_function_privilege(r,f,'execute') then raise exception 'security_budget_public_rpc';end if;
  end loop;
  if has_table_privilege(r,'private.security_request_budgets','select') or has_table_privilege(r,'private.document_verification_leases','select') then raise exception 'security_budget_table_access';end if;
 end loop;
 if exists(select 1 from pg_class where oid in('private.security_request_budgets'::regclass,'private.document_verification_leases'::regclass) and not relrowsecurity) then raise exception 'security_budget_rls';end if;
 for n in 1..10 loop if not public.reserve_login_attempt(network,account,pair) then raise exception 'security_pair_early_block';end if;end loop;
 if public.reserve_login_attempt(network,account,pair) then raise exception 'security_pair_limit_missing';end if;
 -- Two pairs reach the account cap; a third pair cannot bypass it.
 for n in 1..10 loop if not public.reserve_login_attempt(network,account,encode(extensions.gen_random_bytes(32),'hex')) then raise exception 'security_account_early_block';end if;end loop;
 if public.reserve_login_attempt(network,account,encode(extensions.gen_random_bytes(32),'hex')) then raise exception 'security_account_limit_missing';end if;
 account:=encode(extensions.gen_random_bytes(32),'hex');pair:=encode(extensions.gen_random_bytes(32),'hex');
 for n in 1..40 loop if not public.reserve_login_attempt(network,encode(extensions.gen_random_bytes(32),'hex'),encode(extensions.gen_random_bytes(32),'hex')) then raise exception 'security_network_early_block';end if;end loop;
 if public.reserve_login_attempt(network,account,pair) then raise exception 'security_network_limit_missing';end if;
 update private.security_request_budgets set expires_at=clock_timestamp()-interval '1 second' where bucket_key='login-network:'||network;
 if not public.reserve_login_attempt(network,account,pair) then raise exception 'security_expiry_missing';end if;
 denied:=false;begin perform public.reserve_login_attempt('raw-ip','raw-email','raw-pair');exception when raise_exception then denied:=sqlerrm='invalid_input';end;
 if not denied then raise exception 'security_accepts_unhashed_identity';end if;

 insert into auth.users(id,email_confirmed_at) values(u,clock_timestamp()),(free_u,clock_timestamp());
 insert into private.complimentary_premium(user_id,access_until,reason) values(u,clock_timestamp()+interval '1 hour','Rollback-only security test');
 denied:=false;begin perform public.reserve_document_verification(free_u);exception when raise_exception then denied:=sqlerrm='premium_required';end;
 if not denied then raise exception 'security_document_free_access';end if;
 lease_id:=public.reserve_document_verification(u);
 denied:=false;begin perform public.reserve_document_verification(u);exception when raise_exception then denied:=sqlerrm='rate_limited';end;
 if not denied then raise exception 'security_document_concurrency';end if;
 perform public.release_document_verification(free_u,lease_id);
 if not exists(select 1 from private.document_verification_leases where user_id=u and lease=lease_id) then raise exception 'security_document_lease_idor';end if;
 -- An interrupted process releases itself on expiry; stale cleanup cannot delete the new lease.
 update private.document_verification_leases set expires_at=clock_timestamp()-interval '1 second' where user_id=u;
 next_lease:=public.reserve_document_verification(u);perform public.release_document_verification(u,lease_id);
 if not exists(select 1 from private.document_verification_leases where user_id=u and lease=next_lease) then raise exception 'security_document_stale_cleanup';end if;
 perform public.release_document_verification(u,next_lease);
 for n in 3..5 loop lease_id:=public.reserve_document_verification(u);perform public.release_document_verification(u,lease_id);end loop;
 denied:=false;begin perform public.reserve_document_verification(u);exception when raise_exception then denied:=sqlerrm='rate_limited';end;
 if not denied then raise exception 'security_document_rate_missing';end if;
 insert into private.study_documents(user_id,institution,year,selection,exam_url,answer_url,source_url,verified_on)
 select u,'etec',2026,'Rollback-only fixture','https://fatweb.s3.amazonaws.com/vestibulinhoetec/'||series.number||'.pdf','https://fatweb.s3.amazonaws.com/vestibulinhoetec/answer.pdf','https://vestibulinho.etec.sp.gov.br/provas-gabaritos/',current_date from generate_series(1,100) series(number);
 denied:=false;begin perform public.reserve_document_verification(u);exception when raise_exception then denied:=sqlerrm='activity_limit';end;
 if not denied then raise exception 'security_document_storage_quota';end if;
end$$;
select true as security_budgets_sql_passed;
