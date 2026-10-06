-- Payment evidence is separate from access rights. No Premium grant in this migration.
create table private.cakto_payment_checks (
 id bigint generated always as identity primary key,
 event_id bigint not null references private.cakto_event_inbox(id) on delete cascade,
 fingerprint text not null unique check(fingerprint ~ '^[a-f0-9]{64}$'),
 outcome text not null check(outcome in('verified','review','retry')),
 reason text not null,
 order_id text not null,
 intent_reference text references private.checkout_intents(reference) on delete cascade,
 subscription_id uuid,
 order_created_at timestamptz,
 paid_at timestamptz,
 paid_price_cents integer,
 currency text,
 checked_at timestamptz not null default clock_timestamp(),
 check((outcome='verified' and reason='payment_verified' and intent_reference is not null and subscription_id is not null
   and order_created_at is not null and paid_at is not null and isfinite(order_created_at) and isfinite(paid_at)
   and paid_at>=order_created_at and paid_price_cents is not null and paid_price_cents in(1150,2299) and currency is not null and currency='BRL') or
  (outcome<>'verified' and reason<>'payment_verified' and intent_reference is null and subscription_id is null
   and order_created_at is null and paid_at is null and paid_price_cents is null and currency is null))
);
create unique index cakto_payment_verified_order_idx on private.cakto_payment_checks(order_id) where outcome='verified';
create unique index cakto_payment_verified_intent_idx on private.cakto_payment_checks(intent_reference) where outcome='verified';
create unique index cakto_payment_verified_subscription_idx on private.cakto_payment_checks(subscription_id) where outcome='verified';
create index cakto_payment_checks_event_idx on private.cakto_payment_checks(event_id,checked_at);
alter table private.cakto_payment_checks enable row level security;
revoke all on private.cakto_payment_checks from public,anon,authenticated,service_role;
revoke all on sequence private.cakto_payment_checks_id_seq from public,anon,authenticated,service_role;

create function public.read_cakto_payment_signal(p_event_id bigint) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('orderId',order_id,'productId',product_id,'offerId',offer_id,'event',event)
 from private.cakto_event_inbox where id=p_event_id;
$$;

create function public.resolve_cakto_payment_intent(p_event_id bigint,p_reference text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('orderId',s.order_id,'productId',i.product_id,'offerId',i.offer_id,
  'reference',i.reference,'createdAt',i.created_at,'expiresAt',i.expires_at,
  'firstPriceCents',i.first_price_cents,'monthlyPriceCents',i.monthly_price_cents,'currency',i.currency)
 from private.checkout_intents i join private.cakto_event_inbox s on s.id=p_event_id
  and s.product_id=i.product_id and s.offer_id=i.offer_id
 join auth.users u on u.id=i.user_id and u.email_confirmed_at is not null
 where i.provider='cakto' and i.reference=p_reference and p_reference ~ '^[a-f0-9]{64}$';
$$;

create function public.record_cakto_payment_check(p_event_id bigint,p_result jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare s private.cakto_event_inbox; i private.checkout_intents; e jsonb; k text; f text;
 outcome_value text; reason_value text; reference_value text; subscription_value uuid; ordered_value timestamptz; paid_value timestamptz; price_value integer;
begin
 if p_result is null or jsonb_typeof(p_result)<>'object' or octet_length(p_result::text)>4096 then raise exception 'invalid_payment_check';end if;
 select * into s from private.cakto_event_inbox where id=p_event_id for update;
 if not found then raise exception 'signal_not_found';end if;
 outcome_value:=p_result->>'outcome';reason_value:=p_result->>'reason';
 if not p_result ?& array['outcome','reason'] or jsonb_typeof(p_result->'outcome')<>'string' or jsonb_typeof(p_result->'reason')<>'string' or
  outcome_value<>all(array['verified','review','retry']) or reason_value<>all(array[
   'payment_verified','event_requires_lifecycle_processing','signal_not_allowed','reference_missing','intent_not_found','identity_mismatch',
   'invalid_expectation','not_first_subscription_payment','not_paid_or_reversed','reference_mismatch','invalid_payment_dates','currency_unconfirmed',
   'amount_or_coupon_mismatch','incomplete_provider_response','configuration_missing','invalid_id','unavailable','unauthorized','not_found','rate_limited','invalid_response']) then raise exception 'invalid_payment_check';end if;
 if (outcome_value='verified') is distinct from (reason_value='payment_verified') then raise exception 'invalid_payment_check';end if;
 for k in select jsonb_object_keys(p_result) loop
  if k<>all(case when outcome_value='verified' then array['outcome','reason','reference','evidence'] else array['outcome','reason'] end) then raise exception 'private_or_unknown_field';end if;
 end loop;
 if outcome_value='verified' then
  if s.event<>all(array['purchase_approved','subscription_created']) or not p_result ?& array['reference','evidence'] or
   jsonb_typeof(p_result->'reference')<>'string' or p_result->>'reference' !~ '^[a-f0-9]{64}$' or jsonb_typeof(p_result->'evidence')<>'object' then raise exception 'invalid_payment_evidence';end if;
  e:=p_result->'evidence';
  if not e ?& array['orderId','subscriptionId','productId','offerId','orderCreatedAt','paidAt','paidPriceCents','currency'] then raise exception 'invalid_payment_evidence';end if;
  for k in select jsonb_object_keys(e) loop
   if k<>all(array['orderId','subscriptionId','productId','offerId','orderCreatedAt','paidAt','paidPriceCents','currency']) then raise exception 'private_or_unknown_field';end if;
  end loop;
  foreach k in array array['orderId','subscriptionId','productId','offerId','orderCreatedAt','paidAt','currency'] loop
   if jsonb_typeof(e->k)<>'string' then raise exception 'invalid_payment_evidence';end if;
  end loop;
  if jsonb_typeof(e->'paidPriceCents')<>'number' or e->>'paidPriceCents' !~ '^(1150|2299)$' or e->>'currency'<>'BRL' or
   e->>'orderId'<>s.order_id or e->>'productId'<>s.product_id or e->>'offerId'<>s.offer_id or
   e->>'orderId' !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' or
   e->>'subscriptionId' !~* '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then raise exception 'invalid_payment_evidence';end if;
  reference_value:=p_result->>'reference';
  perform pg_advisory_xact_lock(hashtextextended('cakto-first-payment:'||reference_value,0));
  select * into i from private.checkout_intents where reference=reference_value and provider='cakto';
  if not found or i.product_id<>s.product_id or i.offer_id<>s.offer_id or i.currency<>'BRL' or i.monthly_price_cents<>2299 or
   not exists(select 1 from auth.users where id=i.user_id and email_confirmed_at is not null) then raise exception 'intent_not_found';end if;
  subscription_value:=(e->>'subscriptionId')::uuid;ordered_value:=(e->>'orderCreatedAt')::timestamptz;
  paid_value:=(e->>'paidAt')::timestamptz;price_value:=(e->>'paidPriceCents')::integer;
  if not isfinite(ordered_value) or not isfinite(paid_value) or ordered_value<i.created_at or ordered_value>i.expires_at or
    paid_value<ordered_value or paid_value>clock_timestamp() or price_value<>i.first_price_cents then raise exception 'invalid_payment_evidence';end if;
  if exists(select 1 from private.cakto_payment_checks where outcome='verified' and
    (order_id=s.order_id or intent_reference=reference_value or subscription_id=subscription_value)) then
   if exists(select 1 from private.cakto_payment_checks where outcome='verified' and order_id=s.order_id and intent_reference=reference_value
      and subscription_id=subscription_value and paid_at=paid_value and order_created_at=ordered_value and paid_price_cents=price_value) then return;end if;
   raise exception 'payment_identity_conflict';
  end if;
 end if;
 f:=encode(extensions.digest(convert_to(jsonb_build_object('eventId',p_event_id,'result',p_result)::text,'UTF8'),'sha256'),'hex');
 insert into private.cakto_payment_checks(event_id,fingerprint,outcome,reason,order_id,intent_reference,subscription_id,order_created_at,paid_at,paid_price_cents,currency)
 values(p_event_id,f,outcome_value,reason_value,s.order_id,reference_value,subscription_value,ordered_value,paid_value,price_value,case when outcome_value='verified' then 'BRL' else null end)
 on conflict(fingerprint) do nothing;
 -- Never mutate subscriptions, quota rights or the original authenticated signal.
end;$$;

revoke all on function public.read_cakto_payment_signal(bigint) from public,anon,authenticated,service_role;
revoke all on function public.resolve_cakto_payment_intent(bigint,text) from public,anon,authenticated,service_role;
revoke all on function public.record_cakto_payment_check(bigint,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.read_cakto_payment_signal(bigint) to service_role;
grant execute on function public.resolve_cakto_payment_intent(bigint,text) to service_role;
grant execute on function public.record_cakto_payment_check(bigint,jsonb) to service_role;
