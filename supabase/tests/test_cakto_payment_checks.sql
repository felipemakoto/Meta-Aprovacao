begin;
do $$
declare u uuid:=gen_random_uuid(); order_value uuid:=gen_random_uuid(); sub_value uuid:=gen_random_uuid(); ref text:=encode(extensions.gen_random_bytes(32),'hex');
 t timestamptz:=clock_timestamp(); event_value bigint; result_value jsonb; r jsonb; denied boolean; role_name text; before_count bigint;
begin
 select count(*) into before_count from private.cakto_payment_checks;
 insert into auth.users(id,email_confirmed_at) values(u,t);
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values(ref,u,'cakto','fixture-product','fixture-offer','https://pay.cakto.com.br/fixture',1150,2299,t-interval '1 minute',t+interval '59 minutes');
 set local role service_role;
 perform public.receive_cakto_events(jsonb_build_array(jsonb_build_object('event','purchase_approved','orderId',order_value::text,'productId','fixture-product','offerId','fixture-offer','status','paid','subscriptionId',sub_value::text,'reference',null,'paidAt',t-interval '20 seconds','refundedAt',null,'chargedbackAt',null,'canceledAt',null)));
 reset role;
 select id into event_value from private.cakto_event_inbox where order_id=order_value::text;
 set local role service_role;
 r:=public.read_cakto_payment_signal(event_value);
 if r->>'orderId'<>order_value::text or (select count(*) from jsonb_object_keys(r))<>4 then raise exception 'signal contract';end if;
 r:=public.resolve_cakto_payment_intent(event_value,ref);
 if r->>'reference'<>ref or r ? 'userId' or (r->>'firstPriceCents')::integer<>1150 then raise exception 'intent contract';end if;
 if public.resolve_cakto_payment_intent(event_value,repeat('0',64)) is not null then raise exception 'unknown intent accepted';end if;
 perform public.record_cakto_payment_check(event_value,'{"outcome":"review","reason":"currency_unconfirmed"}'::jsonb);
 perform public.record_cakto_payment_check(event_value,'{"outcome":"review","reason":"currency_unconfirmed"}'::jsonb);
 result_value:=jsonb_build_object('outcome','verified','reason','payment_verified','reference',ref,'evidence',jsonb_build_object('orderId',order_value::text,'subscriptionId',sub_value::text,'productId','fixture-product','offerId','fixture-offer','orderCreatedAt',t-interval '30 seconds','paidAt',t-interval '20 seconds','paidPriceCents',1150,'currency','BRL'));
 perform public.record_cakto_payment_check(event_value,result_value);
 perform public.record_cakto_payment_check(event_value,result_value);
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'payment check granted rights';end if;
 denied:=false;begin perform public.record_cakto_payment_check(event_value,result_value||'{"customer":{"email":"private"}}'::jsonb);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'private field accepted';end if;
 denied:=false;begin perform public.record_cakto_payment_check(event_value,jsonb_set(result_value,'{evidence,paidPriceCents}','2299'));exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'wrong price accepted';end if;
 denied:=false;begin perform public.record_cakto_payment_check(event_value,jsonb_set(result_value,'{reference}',to_jsonb(repeat('0',64))));exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'foreign reference accepted';end if;
 denied:=false;begin perform public.record_cakto_payment_check(event_value,'{"outcome":"review","reason":"payment_verified"}'::jsonb);exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'invalid outcome accepted';end if;
 reset role;
 if (select count(*) from private.cakto_payment_checks)<>before_count+2 then raise exception 'dedup failed';end if;
 if exists(select 1 from private.cakto_payment_checks where event_id=event_value and outcome='verified' and intent_reference<>ref) then raise exception 'wrong owner';end if;
 if exists(select 1 from private.subscriptions where user_id=u) then raise exception 'subscription created by evidence';end if;
 foreach role_name in array array['anon','authenticated','service_role'] loop
  if has_table_privilege(role_name,'private.cakto_payment_checks','select,insert,update,delete') then raise exception 'direct check access';end if;
 end loop;
 foreach role_name in array array['anon','authenticated'] loop
  if has_function_privilege(role_name,'public.read_cakto_payment_signal(bigint)','execute') or has_function_privilege(role_name,'public.resolve_cakto_payment_intent(bigint,text)','execute') or has_function_privilege(role_name,'public.record_cakto_payment_check(bigint,jsonb)','execute') then raise exception 'client RPC access';end if;
 end loop;
 if not (select relrowsecurity from pg_class where oid='private.cakto_payment_checks'::regclass) then raise exception 'RLS disabled';end if;
end;$$;
select true as cakto_payment_checks_passed;
rollback;
