begin;
do $$
declare u uuid:=gen_random_uuid();origin uuid:=gen_random_uuid();renewal uuid:=gen_random_uuid();sub uuid:=gen_random_uuid();ref text:=encode(extensions.gen_random_bytes(32),'hex');
 ev bigint;ev2 bigint;ev3 bigint;proof bigint;snap jsonb;r jsonb;lease jsonb;t timestamptz:=clock_timestamp();n bigint;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t);
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values(ref,u,'cakto','lifecycle-fixture','offer','https://pay.cakto.com.br/fixture',1150,2299,t-interval '2 hours',t-interval '1 hour');
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref||'first','sha256'),'hex'),'purchase_approved',origin::text,'lifecycle-fixture','offer','{}') returning id into ev;
 -- Independent stage-29 proof fixture; no claim that these values came from a real payment.
 insert into private.cakto_payment_checks(event_id,fingerprint,outcome,reason,order_id,intent_reference,subscription_id,order_created_at,paid_at,paid_price_cents,currency)
 values(ev,encode(extensions.digest(ref||'proof','sha256'),'hex'),'verified','payment_verified',origin::text,ref,sub,t-interval '100 minutes',t-interval '90 minutes',1150,'BRL') returning id into proof;
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref||'cancel','sha256'),'hex'),'subscription_canceled',origin::text,'lifecycle-fixture','offer','{}') returning id into ev2;
 insert into private.subscriptions(user_id,provider,external_subscription_id,external_product_id,external_plan_id,provider_status,access_state,access_from,access_until,last_verified_order_id,last_verified_at,last_synced_at)
 values(u,'cakto',sub::text,'lifecycle-fixture','offer','active','granted',t-interval '1 hour',t+interval '29 days',origin::text,t-interval '1 hour',t-interval '1 hour');
 if public.resolve_cakto_lifecycle_binding(ev2,sub,origin) is null or public.resolve_cakto_lifecycle_binding(ev2,gen_random_uuid(),origin) is not null then raise exception 'binding invalid';end if;
 snap:=jsonb_build_object('subscriptionId',sub,'originOrderId',origin,'productId','lifecycle-fixture','offerId','offer','providerStatus','canceled','providerUpdatedAt',t-interval '1 minute','orderStatus','paid','action','preserve','occurredAt',null);
 r:=jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap);
 perform public.record_cakto_lifecycle_check(ev2,r);perform public.record_cakto_lifecycle_check(ev2,r);
 if (select count(*) from private.cakto_lifecycle_checks where event_id=ev2)<>1 then raise exception 'duplicate observation';end if;
 if not exists(select 1 from private.subscriptions where user_id=u and provider_status='canceled' and access_state='granted' and access_until=t+interval '29 days') then raise exception 'cancellation lost paid period';end if;
 -- Older authoritative snapshot cannot roll the current provider state back.
 perform public.record_cakto_lifecycle_check(ev2,jsonb_set(jsonb_set(r,'{snapshot,providerStatus}','"active"'),'{snapshot,providerUpdatedAt}',to_jsonb(t-interval '2 minutes')));
 if (select provider_status from private.subscriptions where user_id=u)<>'canceled' then raise exception 'stale snapshot changed state';end if;
 -- A refunded old order must not revoke a newer paid interval.
 update private.subscriptions set last_verified_order_id=renewal::text where user_id=u;
 snap:=snap||jsonb_build_object('providerStatus','active','providerUpdatedAt',t-interval '30 seconds','orderStatus','refunded','action','revoke','occurredAt',t-interval '5 minutes');
 perform public.record_cakto_lifecycle_check(ev2,jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap));
 if not exists(select 1 from private.subscriptions where user_id=u and access_state='granted') then raise exception 'old reversal revoked new order';end if;
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref||'refund','sha256'),'hex'),'refund',renewal::text,'lifecycle-fixture','offer','{}') returning id into ev3;
 -- Finish an actual leased lifecycle job atomically, with a current-order reversal.
 update private.cakto_event_inbox set product_id='unleased-fixture' where id=ev;
 insert into private.cakto_payment_jobs(event_id,state) values(ev2,'review');
 lease:=public.lease_cakto_payment_job('lifecycle-fixture',array['offer']);
 if lease is null or (lease->>'eventId')::bigint<>ev3 then raise exception 'lifecycle not leased';end if;
 perform public.finish_cakto_lifecycle_job(ev3,(lease->>'leaseToken')::uuid,jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap));
 if not exists(select 1 from private.subscriptions where user_id=u and access_state='revoked' and access_until=t+interval '29 days') then raise exception 'current reversal not revoked';end if;
 if (select state from private.cakto_payment_jobs where event_id=ev3)<>'verified' then raise exception 'job not finished';end if;
 begin
  perform public.finish_cakto_lifecycle_job(ev3,(lease->>'leaseToken')::uuid,r);raise exception 'duplicate finish accepted';
 exception when others then if sqlerrm='duplicate finish accepted' then raise;end if;end;
 -- An active/paid observation cannot restore access after a reversal.
 snap:=snap||jsonb_build_object('providerUpdatedAt',t,'orderStatus','paid','action','preserve','occurredAt',null);
 perform public.record_cakto_lifecycle_check(ev3,jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap));
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'replay restored revoked access';end if;
 select count(*) into n from private.cakto_lifecycle_checks where event_id=ev3;
 begin
  perform public.record_cakto_lifecycle_check(ev3,jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap||jsonb_build_object('customer','private')));raise exception 'private field accepted';
 exception when others then if sqlerrm='private field accepted' then raise;end if;end;
 begin
  perform public.record_cakto_lifecycle_check(ev3,jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap||jsonb_build_object('subscriptionId',gen_random_uuid())));raise exception 'foreign subscription accepted';
 exception when others then if sqlerrm='foreign subscription accepted' then raise;end if;end;
 if (select count(*) from private.cakto_lifecycle_checks where event_id=ev3)<>n then raise exception 'invalid check persisted';end if;
 if not (select relrowsecurity from pg_class where oid='private.cakto_lifecycle_checks'::regclass) or
 has_table_privilege('service_role','private.cakto_lifecycle_checks','SELECT,INSERT,UPDATE,DELETE') or
 has_function_privilege('anon','public.record_cakto_lifecycle_check(bigint,jsonb)','EXECUTE') or
 has_function_privilege('authenticated','public.finish_cakto_lifecycle_job(bigint,uuid,jsonb)','EXECUTE') or
 not has_function_privilege('service_role','public.finish_cakto_lifecycle_job(bigint,uuid,jsonb)','EXECUTE') then raise exception 'permissions invalid';end if;
end$$;
select true as lifecycle_binding_cancel_stale_reversal_lease_privacy_passed;
rollback;
