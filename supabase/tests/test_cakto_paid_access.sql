begin;
do $$
declare u uuid:=gen_random_uuid();origin uuid:=gen_random_uuid();o2 uuid:=gen_random_uuid();o3 uuid:=gen_random_uuid();sub uuid:=gen_random_uuid();ref text:=encode(extensions.gen_random_bytes(32),'hex');
 ev bigint;ev2 bigint;ev3 bigint;proof bigint;local_id uuid;t timestamptz:=clock_timestamp();first_paid timestamptz:=t-interval '80 days';
 result_value jsonb;snap jsonb;r jsonb;until_value timestamptz;denied boolean;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t);
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values(ref,u,'cakto','access-fixture','offer','https://pay.cakto.com.br/fixture',1150,2299,first_paid-interval '1 minute',first_paid+interval '59 minutes');
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref,'sha256'),'hex'),'purchase_approved',origin::text,'access-fixture','offer','{}') returning id into ev;
 result_value:=jsonb_build_object('outcome','verified','reason','payment_verified','reference',ref,'evidence',jsonb_build_object('orderId',origin,'subscriptionId',sub,'productId','access-fixture','offerId','offer','orderCreatedAt',first_paid-interval '30 seconds','paidAt',first_paid,'paidPriceCents',1150,'currency','BRL'));
 perform public.record_cakto_payment_check(ev,result_value);perform public.record_cakto_payment_check(ev,result_value);
 select id into local_id from private.subscriptions where user_id=u;
 if local_id is null or (select count(*) from private.cakto_access_periods where subscription_id=local_id)<>1 then raise exception 'first grant/dedup failed';end if;
 if not exists(select 1 from private.cakto_access_periods where order_id=origin and access_from=first_paid and access_until=first_paid+interval '720 hours') then raise exception 'wrong first duration';end if;
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'expired payment granted current access';end if;
 if not public.enqueue_cakto_api_order(o2,sub,'access-fixture','offer','') or public.enqueue_cakto_api_order(gen_random_uuid(),gen_random_uuid(),'access-fixture','offer','') then raise exception 'renewal discovery binding invalid';end if;
 select id into ev2 from private.cakto_event_inbox where order_id=o2::text;
 if (public.resolve_cakto_lifecycle_binding(ev2,sub,origin)->>'expectedPeriod')::integer<>2 then raise exception 'period sequence invalid';end if;
 snap:=jsonb_build_object('subscriptionId',sub,'originOrderId',origin,'productId','access-fixture','offerId','offer','providerStatus','active','providerUpdatedAt',t-interval '1 minute','orderStatus','paid','action','preserve','occurredAt',null);
 r:=jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap,'renewal',jsonb_build_object('orderId',o2,'period',2,'orderCreatedAt',t-interval '41 days','paidAt',t-interval '40 days','paidPriceCents',2299,'currency','BRL'));
 perform public.record_cakto_lifecycle_check(ev2,r);perform public.record_cakto_lifecycle_check(ev2,r);
 if not exists(select 1 from private.cakto_access_periods where order_id=o2 and access_from=t-interval '40 days' and access_until=t-interval '10 days') then raise exception 'late renewal wrong start';end if;
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'expired renewal granted current access';end if;
 perform public.enqueue_cakto_api_order(o3,sub,'access-fixture','offer','');select id into ev3 from private.cakto_event_inbox where order_id=o3::text;
 r:=jsonb_set(jsonb_set(jsonb_set(jsonb_set(r,'{renewal,orderId}',to_jsonb(o3)),'{renewal,period}','3'),'{renewal,orderCreatedAt}',to_jsonb(t-interval '3 days')),'{renewal,paidAt}',to_jsonb(t-interval '2 days'));
 perform public.record_cakto_lifecycle_check(ev3,r);
 until_value:=(public.read_subscription_access(u)->>'accessUntil')::timestamptz;
 if until_value<>t+interval '28 days' or not (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'current renewal not granted';end if;
 -- Replay/conflict cannot create additional time. Foreign/incorrect payload rolls back entirely.
 denied:=false;begin perform public.record_cakto_lifecycle_check(ev3,jsonb_set(r,'{renewal,paidPriceCents}','1150'));exception when others then denied:=true;end;
 if not denied or (select count(*) from private.cakto_access_periods where subscription_id=local_id)<>3 then raise exception 'invalid renewal persisted';end if;
 -- Cancellation preserves, reversal removes only this order; replay never resurrects it.
 snap:=snap||jsonb_build_object('providerStatus','canceled','providerUpdatedAt',t,'orderStatus','paid');
 perform public.record_cakto_lifecycle_check(ev2,jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap));
 if not (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'cancellation revoked paid period';end if;
 snap:=snap||jsonb_build_object('orderStatus','refunded','action','revoke','occurredAt',t-interval '1 day');
 perform public.record_cakto_lifecycle_check(ev3,jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',snap));
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'refund left revoked period accessible';end if;
 perform public.record_cakto_lifecycle_check(ev3,r);
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'renewal replay restored access';end if;
 -- Deleting evidence cannot fall back to an unbacked aggregated interval.
 update private.subscriptions set access_state='granted',access_from=t-interval '1 hour',access_until=t+interval '1 day' where id=local_id;
 delete from private.cakto_access_periods where subscription_id=local_id;
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'missing ledger restored access';end if;
 if has_table_privilege('service_role','private.cakto_access_periods','SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('anon','private.cakto_renewal_payments','SELECT,INSERT,UPDATE,DELETE') or
  has_function_privilege('service_role','private.apply_cakto_paid_period(bigint,bigint,uuid,integer,timestamptz)','EXECUTE') or
  has_function_privilege('authenticated','public.record_cakto_payment_check(bigint,jsonb)','EXECUTE') then raise exception 'access permissions invalid';end if;
end$$;
select true as paid_access_first_late_renewal_reversal_expiry_privacy_passed;
rollback;
