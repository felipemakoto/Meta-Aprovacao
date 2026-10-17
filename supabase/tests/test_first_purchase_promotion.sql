do $$
declare u uuid:=gen_random_uuid(); other_u uuid:=gen_random_uuid(); unconfirmed uuid:=gen_random_uuid();
 origin uuid:=gen_random_uuid(); sub uuid:=gen_random_uuid(); ref text:=encode(extensions.gen_random_bytes(32),'hex');
 t timestamptz:=clock_timestamp(); paid timestamptz:=t-interval '40 days';
 ev bigint; reversal_ev bigint; r jsonb; initial_intent jsonb; regular_intent jsonb; proof jsonb; denied boolean; role_name text; price integer;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t),(other_u,t),(unconfirmed,null);
 set local role service_role;
 r:=public.read_subscription_pricing(u);
 if r<>jsonb_build_object('hasPremium',false,'accessUntil',null,'hasPaidBefore',false) then raise exception 'promotion_new_account';end if;
 denied:=false;begin perform public.read_subscription_pricing(unconfirmed);exception when raise_exception then denied:=sqlerrm='login_required';end;
 if not denied then raise exception 'promotion_unconfirmed_account';end if;
 reset role;
 price:=case when t>=timestamptz '2026-10-01 00:00:00-03' and t<timestamptz '2026-11-01 00:00:00-03' then 1150 else 2299 end;
 initial_intent:=public.create_checkout_intent(u,'promotion-fixture','offer','https://pay.cakto.com.br/fixture',price);
 if public.read_subscription_pricing(u)->>'hasPaidBefore'<>'false' then raise exception 'promotion_intent_is_not_payment';end if;
 insert into private.checkout_intents(reference,user_id,provider,product_id,offer_id,checkout_url,first_price_cents,monthly_price_cents,created_at,expires_at)
 values(ref,u,'cakto','promotion-fixture','offer','https://pay.cakto.com.br/fixture',1150,2299,paid-interval '1 minute',paid+interval '59 minutes');
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref,'sha256'),'hex'),'purchase_approved',origin::text,'promotion-fixture','offer','{}') returning id into ev;
 perform public.record_cakto_payment_check(ev,'{"outcome":"review","reason":"currency_unconfirmed"}'::jsonb);
 if public.read_subscription_pricing(u)->>'hasPaidBefore'<>'false' then raise exception 'promotion_review_is_not_payment';end if;
 proof:=jsonb_build_object('outcome','verified','reason','payment_verified','reference',ref,'evidence',jsonb_build_object(
  'orderId',origin,'subscriptionId',sub,'productId','promotion-fixture','offerId','offer','orderCreatedAt',paid-interval '30 seconds','paidAt',paid,'paidPriceCents',1150,'currency','BRL'));
 perform public.record_cakto_payment_check(ev,proof);
 perform public.record_cakto_payment_check(ev,proof);
 r:=public.read_subscription_pricing(u);
 if r<>jsonb_build_object('hasPremium',false,'accessUntil',null,'hasPaidBefore',true) then raise exception 'promotion_expired_payer';end if;
 if public.read_subscription_pricing(other_u)->>'hasPaidBefore'<>'false' then raise exception 'promotion_account_isolation';end if;
 regular_intent:=public.create_checkout_intent(u,'promotion-fixture','offer','https://pay.cakto.com.br/fixture',2299);
 if (regular_intent->>'firstPriceCents')::integer<>2299 then raise exception 'promotion_regular_intent';end if;
 if price=1150 and regular_intent->>'reference'=initial_intent->>'reference' then raise exception 'promotion_reused_old_discount';end if;
 denied:=false;begin perform public.create_checkout_intent(u,'promotion-fixture','offer','https://pay.cakto.com.br/fixture?coupon=primeiracompra',1150);exception when raise_exception then denied:=sqlerrm='invalid_checkout_offer';end;
 if not denied then raise exception 'promotion_discount_after_payment';end if;
 denied:=false;begin perform public.create_checkout_intent(u,'promotion-fixture','offer','https://pay.cakto.com.br/fixture?coupon=primeiracompra',2299);exception when raise_exception then denied:=sqlerrm='invalid_checkout_offer';end;
 if not denied then raise exception 'promotion_coupon_on_regular_intent';end if;
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
 values(encode(extensions.digest(ref||'-reversal','sha256'),'hex'),'refund',origin::text,'promotion-fixture','offer','{}') returning id into reversal_ev;
 perform public.record_cakto_lifecycle_check(reversal_ev,jsonb_build_object('outcome','verified','reason','lifecycle_observed','snapshot',jsonb_build_object(
  'subscriptionId',sub,'originOrderId',origin,'productId','promotion-fixture','offerId','offer','providerStatus','canceled',
  'providerUpdatedAt',t,'orderStatus','refunded','action','revoke','occurredAt',t-interval '1 day')));
 if public.read_subscription_pricing(u)->>'hasPaidBefore'<>'true' then raise exception 'promotion_refund_restored_discount';end if;
 if (select count(*) from private.cakto_payment_checks where intent_reference=ref and outcome='verified')<>1 then raise exception 'promotion_history_duplicate';end if;
 if (select count(*) from jsonb_object_keys(public.read_subscription_pricing(u)))<>3 then raise exception 'promotion_private_fields';end if;
 foreach role_name in array array['anon','authenticated'] loop
  if has_function_privilege(role_name,'public.read_subscription_pricing(uuid)','execute') then raise exception 'promotion_client_rpc';end if;
 end loop;
 foreach role_name in array array['anon','authenticated','service_role'] loop
  if has_function_privilege(role_name,'private.has_paid_premium_before(uuid)','execute') then raise exception 'promotion_private_history';end if;
 end loop;
 if not has_function_privilege('service_role','public.read_subscription_pricing(uuid)','execute') then raise exception 'promotion_server_rpc';end if;
end;$$;
select true as first_purchase_promotion_passed;
