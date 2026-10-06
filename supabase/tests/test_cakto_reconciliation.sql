begin;
do $$
declare product_value text:='fixture-'||gen_random_uuid()::text; order_value uuid:=gen_random_uuid(); sub_value uuid:=gen_random_uuid(); u uuid:=gen_random_uuid(); ref text:=encode(extensions.gen_random_bytes(32),'hex');
 event_value bigint; lease jsonb; second_lease jsonb; denied boolean; role_name text; result_value jsonb:='{"outcome":"retry","reason":"unavailable"}';
begin
 insert into auth.users(id,email_confirmed_at) values(u,clock_timestamp());
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,expires_at)
 values(ref,u,'cakto',product_value,'fixture-offer','https://pay.cakto.com.br/fixture',1150,2299,clock_timestamp()+interval '59 minutes');
 set local role service_role;
 if public.enqueue_cakto_api_order(order_value,sub_value,product_value,'fixture-offer',repeat('0',64)) then raise exception 'missing intent accepted';end if;
 if not public.enqueue_cakto_api_order(order_value,sub_value,product_value,'fixture-offer',ref) then raise exception 'known intent not queued';end if;
 perform public.enqueue_cakto_api_order(order_value,sub_value,product_value,'fixture-offer',ref);
 lease:=public.lease_cakto_payment_job(product_value,array['fixture-offer']);
 event_value:=(lease->>'eventId')::bigint;
 if lease is null or (lease->>'attempt')::integer<>1 then raise exception 'no first lease';end if;
 if public.lease_cakto_payment_job(product_value,array['fixture-offer']) is not null then raise exception 'active lease duplicated';end if;
 denied:=false;begin perform public.finish_cakto_payment_job(event_value,gen_random_uuid(),result_value);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'wrong token accepted';end if;
 perform public.finish_cakto_payment_job(event_value,(lease->>'leaseToken')::uuid,result_value);
 if public.lease_cakto_payment_job(product_value,array['fixture-offer']) is not null then raise exception 'retry too soon';end if;
 reset role;
 if (select count(*) from private.cakto_event_inbox where order_id=order_value::text)<>1 or
   (select source from private.cakto_event_inbox where id=event_value)<>'api_reconciliation' then raise exception 'discovery dedup/source';end if;
 if (select state from private.cakto_payment_jobs where event_id=event_value)<>'retry' then raise exception 'retry state';end if;
 update private.cakto_payment_jobs set next_attempt_at=clock_timestamp()-interval '1 second' where event_id=event_value;
 set local role service_role;
 second_lease:=public.lease_cakto_payment_job(product_value,array['fixture-offer']);
 if (second_lease->>'attempt')::integer<>2 or second_lease->>'leaseToken'=lease->>'leaseToken' then raise exception 'retry not renewed';end if;
 reset role;
 update private.cakto_payment_jobs set lease_until=clock_timestamp()-interval '1 second' where event_id=event_value;
 set local role service_role;
 lease:=public.lease_cakto_payment_job(product_value,array['fixture-offer']);
 if (lease->>'attempt')::integer<>3 then raise exception 'expired lease not recovered';end if;
 denied:=false;begin perform public.finish_cakto_payment_job(event_value,(second_lease->>'leaseToken')::uuid,result_value);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'stale worker accepted';end if;
 perform public.finish_cakto_payment_job(event_value,(lease->>'leaseToken')::uuid,'{"outcome":"review","reason":"currency_unconfirmed"}');
 if public.lease_cakto_payment_job(product_value,array['fixture-offer']) is not null then raise exception 'review retried automatically';end if;
 perform public.requeue_cakto_payment_job(event_value);
 lease:=public.lease_cakto_payment_job(product_value,array['fixture-offer']);
 if (lease->>'attempt')::integer<>1 then raise exception 'manual requeue failed';end if;
 reset role;
 update private.cakto_payment_jobs set attempts=8,lease_until=clock_timestamp()-interval '1 second' where event_id=event_value;
 set local role service_role;
 if public.lease_cakto_payment_job(product_value,array['fixture-offer']) is not null then raise exception 'attempt budget bypassed';end if;
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'reconciliation granted premium';end if;
 if (public.cakto_payment_job_summary(product_value)->>'exhausted')::integer<>1 then raise exception 'exhaustion not visible';end if;
 reset role;
 foreach role_name in array array['anon','authenticated','service_role'] loop
  if has_table_privilege(role_name,'private.cakto_payment_jobs','select,insert,update,delete') then raise exception 'direct queue access';end if;
 end loop;
 foreach role_name in array array['anon','authenticated'] loop
  if has_function_privilege(role_name,'public.lease_cakto_payment_job(text,text[])','execute') or has_function_privilege(role_name,'public.finish_cakto_payment_job(bigint,uuid,jsonb)','execute') then raise exception 'client queue access';end if;
 end loop;
 if not (select relrowsecurity from pg_class where oid='private.cakto_payment_jobs'::regclass) then raise exception 'queue RLS disabled';end if;
end;$$;
select true as cakto_reconciliation_passed;
rollback;
