do $$
declare u uuid:=gen_random_uuid();v uuid:=gen_random_uuid();ref text:=encode(extensions.gen_random_bytes(32),'hex');lease uuid:=gen_random_uuid();otherlease uuid:=gen_random_uuid();id uuid;orderid uuid:=gen_random_uuid();a jsonb;b jsonb;denied boolean;f record;
begin
 insert into auth.users(id,email_confirmed_at) values(u,clock_timestamp()),(v,clock_timestamp());
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,expires_at)
 values(ref,u,'cakto','direct-checkout-fixture','offer','https://pay.cakto.com.br/fixture',2299,2299,clock_timestamp()+interval '1 hour');
 for f in select p.oid from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('read_direct_checkout','begin_direct_checkout','resume_direct_checkout','finish_direct_checkout','refresh_direct_checkout','claim_direct_refresh','create_guarded_checkout_intent') loop
  if has_function_privilege('anon',f.oid,'EXECUTE') or has_function_privilege('authenticated',f.oid,'EXECUTE') or not has_function_privilege('service_role',f.oid,'EXECUTE') then raise exception 'direct_function_acl';end if;
 end loop;
 if has_table_privilege('authenticated','private.direct_checkout_attempts','SELECT') or has_table_privilege('service_role','private.direct_checkout_attempts','SELECT') or not(select relrowsecurity from pg_class where oid='private.direct_checkout_attempts'::regclass) then raise exception 'direct_table_acl';end if;
 denied:=false;begin perform public.begin_direct_checkout(v,ref,'pix',repeat('x',50),repeat('a',64),lease);exception when raise_exception then denied:=sqlerrm='invalid_input';end;if not denied then raise exception 'direct_foreign_intent';end if;
 a:=public.begin_direct_checkout(u,ref,'pix',repeat('x',50),repeat('a',64),lease);id:=(a->'attempt'->>'id')::uuid;
 if not(a->>'claimed')::boolean or id is null then raise exception 'direct_claim';end if;
 denied:=false;begin perform public.create_guarded_checkout_intent(u,'product','offer','https://pay.cakto.com.br/fixture',2299);exception when raise_exception then denied:=sqlerrm='payment_pending';end;if not denied then raise exception 'direct_hosted_bypass';end if;
 b:=public.begin_direct_checkout(u,ref,'pix',repeat('y',50),repeat('b',64),otherlease);
 if (b->>'claimed')::boolean or b->'attempt'->>'id'<>id::text then raise exception 'direct_duplicate';end if;
 if public.read_direct_checkout(v) is not null then raise exception 'direct_isolation';end if;
 denied:=false;begin perform public.finish_direct_checkout(v,id,lease,'failed');exception when raise_exception then denied:=sqlerrm='payment_state_changed';end;if not denied then raise exception 'direct_foreign_write';end if;
 update private.direct_checkout_attempts set lease_until=clock_timestamp()-interval '1 second' where user_id=u;
 a:=public.read_direct_checkout(u);if a->>'state'<>'unknown' or a->>'payload'<>repeat('x',50) then raise exception 'direct_uncertain_lease';end if;
 a:=public.resume_direct_checkout(u,otherlease);if not(a->>'claimed')::boolean or a->'attempt'->>'id'<>id::text then raise exception 'direct_resume';end if;
 perform public.finish_direct_checkout(u,id,otherlease,'awaiting',orderid,repeat('1',80),clock_timestamp()+interval '10 minutes');
 if public.claim_direct_refresh(v,id) or not public.claim_direct_refresh(u,id) or public.claim_direct_refresh(u,id) then raise exception 'direct_refresh_throttle';end if;
 a:=public.read_direct_checkout(u);if a->'payload'<>'null'::jsonb or a->>'state'<>'awaiting' then raise exception 'direct_payload_cleanup';end if;
 perform public.refresh_direct_checkout(v,id,orderid,'failed');if public.read_direct_checkout(u)->>'state'<>'awaiting' then raise exception 'direct_refresh_isolation';end if;
 perform public.refresh_direct_checkout(u,id,orderid,'paid');if (private.subscription_access(u)->>'hasPremium')::boolean then raise exception 'direct_unverified_access';end if;
 perform public.refresh_direct_checkout(u,id,orderid,'failed');
 a:=public.begin_direct_checkout(u,ref,'pix',repeat('x',50),repeat('a',64),lease);if not(a->>'claimed')::boolean then raise exception 'direct_retry_failed';end if;
 update private.direct_checkout_attempts set state='unknown',created_at=clock_timestamp()-interval '25 hours' where direct_checkout_attempts.id=(a->'attempt'->>'id')::uuid;
 a:=public.read_direct_checkout(u);if a->'payload'<>'null'::jsonb then raise exception 'direct_retention';end if;
end$$;
select 'direct_checkout_sql_passed' as result;
