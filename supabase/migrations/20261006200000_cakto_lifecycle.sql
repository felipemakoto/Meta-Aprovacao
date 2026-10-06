-- Lifecycle observations are separate from payment proofs and never grant access.
create table private.cakto_lifecycle_checks (
 id bigint generated always as identity primary key,
 event_id bigint not null references private.cakto_event_inbox(id) on delete cascade,
 fingerprint text not null unique check(fingerprint ~ '^[a-f0-9]{64}$'),
 outcome text not null check(outcome in('verified','review','retry')),
 reason text not null,
 first_check_id bigint references private.cakto_payment_checks(id) on delete cascade,
 subscription_id uuid,
 provider_status text,
 provider_updated_at timestamptz,
 order_status text,
 action text check(action in('preserve','revoke')),
 occurred_at timestamptz,
 checked_at timestamptz not null default clock_timestamp(),
 check((outcome='verified' and reason='lifecycle_observed' and first_check_id is not null and subscription_id is not null and
  provider_status is not null and provider_updated_at is not null and isfinite(provider_updated_at) and order_status is not null and action is not null and
  ((action='preserve' and occurred_at is null) or (action='revoke' and occurred_at is not null and isfinite(occurred_at)))) or
  (outcome<>'verified' and reason<>'lifecycle_observed' and first_check_id is null and subscription_id is null and provider_status is null and
   provider_updated_at is null and order_status is null and action is null and occurred_at is null))
);
create index cakto_lifecycle_subscription_idx on private.cakto_lifecycle_checks(subscription_id,provider_updated_at);
alter table private.cakto_lifecycle_checks enable row level security;
revoke all on private.cakto_lifecycle_checks from public,anon,authenticated,service_role;
revoke all on sequence private.cakto_lifecycle_checks_id_seq from public,anon,authenticated,service_role;

create function public.resolve_cakto_lifecycle_binding(p_event_id bigint,p_subscription_id uuid,p_origin_order_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('subscriptionId',c.subscription_id,'originOrderId',c.order_id,'productId',i.product_id,'offerId',i.offer_id)
 from private.cakto_payment_checks c join private.checkout_intents i on i.reference=c.intent_reference and i.provider='cakto'
 join auth.users u on u.id=i.user_id and u.email_confirmed_at is not null
 join private.cakto_event_inbox s on s.id=p_event_id and s.product_id=i.product_id and s.offer_id=i.offer_id
 where c.outcome='verified' and c.subscription_id=p_subscription_id and c.order_id=p_origin_order_id::text;
$$;

create function public.record_cakto_lifecycle_check(p_event_id bigint,p_result jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare s private.cakto_event_inbox; c private.cakto_payment_checks; i private.checkout_intents;
 e jsonb; k text; outcome_value text; reason_value text; sub uuid; updated timestamptz; occurred timestamptz;
 prior timestamptz; f text; t timestamptz:=clock_timestamp();
begin
 if p_result is null or jsonb_typeof(p_result)<>'object' or octet_length(p_result::text)>4096 then raise exception 'invalid_lifecycle_check';end if;
 select * into s from private.cakto_event_inbox where id=p_event_id for update;
 if not found then raise exception 'signal_not_found';end if;
 outcome_value:=p_result->>'outcome';reason_value:=p_result->>'reason';
 if not p_result ?& array['outcome','reason'] or jsonb_typeof(p_result->'outcome')<>'string' or jsonb_typeof(p_result->'reason')<>'string' or
 outcome_value<>all(array['verified','review','retry']) or reason_value<>all(array['lifecycle_observed','signal_not_allowed','subscription_binding_missing',
 'identity_mismatch','lifecycle_response_incomplete','reversal_unconfirmed','currency_unconfirmed','amount_or_coupon_mismatch','paid_period_unconfirmed',
 'configuration_missing','invalid_id','unavailable','unauthorized','not_found','rate_limited','invalid_response']) then raise exception 'invalid_lifecycle_check';end if;
 if (outcome_value='verified') is distinct from (reason_value='lifecycle_observed') then raise exception 'invalid_lifecycle_check';end if;
 for k in select jsonb_object_keys(p_result) loop
  if k<>all(case when outcome_value='verified' then array['outcome','reason','snapshot'] else array['outcome','reason'] end) then raise exception 'private_or_unknown_field';end if;
 end loop;
 if outcome_value='verified' then
  if s.event<>all(array['purchase_refused','refund','refund_requested','chargeback','subscription_canceled','subscription_renewed','subscription_renewal_refused',
   'subscription_paused','subscription_resumed','subscription_late','subscription_late_recovered']) or jsonb_typeof(p_result->'snapshot') is distinct from 'object' then raise exception 'invalid_lifecycle_snapshot';end if;
  e:=p_result->'snapshot';
  if not e ?& array['subscriptionId','originOrderId','productId','offerId','providerStatus','providerUpdatedAt','orderStatus','action','occurredAt'] then raise exception 'invalid_lifecycle_snapshot';end if;
  for k in select jsonb_object_keys(e) loop
   if k<>all(array['subscriptionId','originOrderId','productId','offerId','providerStatus','providerUpdatedAt','orderStatus','action','occurredAt']) then raise exception 'private_or_unknown_field';end if;
  end loop;
  foreach k in array array['subscriptionId','originOrderId','productId','offerId','providerStatus','providerUpdatedAt','orderStatus','action'] loop
   if jsonb_typeof(e->k)<>'string' then raise exception 'invalid_lifecycle_snapshot';end if;
  end loop;
  if e->>'productId'<>s.product_id or e->>'offerId'<>s.offer_id or e->>'providerStatus'<>all(array['active','inactive','canceled','expired','paused','late','trial']) or
   e->>'orderStatus'<>all(array['processing','authorized','paid','refund_requested','in_settlement','acquirer_error','refunded','waiting_payment','refused','blocked','chargedback','canceled','in_protest','partially_paid','prechargeback','scheduled','retrying','MED']) or
   e->>'action'<>all(array['preserve','revoke']) then raise exception 'invalid_lifecycle_snapshot';end if;
  sub:=(e->>'subscriptionId')::uuid;updated:=(e->>'providerUpdatedAt')::timestamptz;
  if not isfinite(updated) or updated>t then raise exception 'invalid_lifecycle_snapshot';end if;
  perform pg_advisory_xact_lock(hashtextextended('cakto-lifecycle:'||sub::text,0));
  select pc.* into c from private.cakto_payment_checks pc where pc.outcome='verified' and pc.subscription_id=sub and pc.order_id=e->>'originOrderId';
  if not found then raise exception 'subscription_binding_missing';end if;
  select * into i from private.checkout_intents where reference=c.intent_reference and provider='cakto';
  if not found or i.product_id<>s.product_id or i.offer_id<>s.offer_id or not exists(select 1 from auth.users where id=i.user_id and email_confirmed_at is not null) then raise exception 'subscription_binding_missing';end if;
  if e->>'action'='revoke' then
   if e->>'orderStatus'<>all(array['refunded','chargedback']) or jsonb_typeof(e->'occurredAt')<>'string' then raise exception 'invalid_lifecycle_snapshot';end if;
   occurred:=(e->>'occurredAt')::timestamptz;
   if not isfinite(occurred) or occurred>t or occurred<c.paid_at then raise exception 'invalid_lifecycle_snapshot';end if;
  elsif jsonb_typeof(e->'occurredAt')<>'null' or e->>'orderStatus'=any(array['refunded','chargedback']) then raise exception 'invalid_lifecycle_snapshot';end if;
  select max(provider_updated_at) into prior from private.cakto_lifecycle_checks where subscription_id=sub and outcome='verified';
  -- Cancellation/late/paused do not shorten or extend an already paid interval.
  if prior is null or updated>prior then
   update private.subscriptions set provider_status=e->>'providerStatus',last_synced_at=t
   where provider='cakto' and external_subscription_id=sub::text and external_product_id=i.product_id and external_plan_id=i.offer_id and user_id=i.user_id;
  end if;
  -- Only the reversed order backing the current interval may revoke it. Revocation is sticky: no path here restores/grants access.
  if e->>'action'='revoke' then
   update private.subscriptions set access_state='revoked',last_synced_at=t
   where provider='cakto' and external_subscription_id=sub::text and external_product_id=i.product_id and external_plan_id=i.offer_id and user_id=i.user_id
    and access_state='granted' and last_verified_order_id=s.order_id;
  end if;
 end if;
 f:=encode(extensions.digest(convert_to(jsonb_build_object('eventId',p_event_id,'result',p_result)::text,'UTF8'),'sha256'),'hex');
 insert into private.cakto_lifecycle_checks(event_id,fingerprint,outcome,reason,first_check_id,subscription_id,provider_status,provider_updated_at,order_status,action,occurred_at)
 values(p_event_id,f,outcome_value,reason_value,c.id,sub,e->>'providerStatus',updated,e->>'orderStatus',e->>'action',occurred) on conflict(fingerprint) do nothing;
end;$$;

create function public.finish_cakto_lifecycle_job(p_event_id bigint,p_lease_token uuid,p_result jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare j private.cakto_payment_jobs; t timestamptz:=clock_timestamp();v text;
begin
 select * into j from private.cakto_payment_jobs where event_id=p_event_id for update;
 if not found or j.state<>'running' or j.lease_token is distinct from p_lease_token or j.lease_until<=t then raise exception 'lease_invalid';end if;
 perform public.record_cakto_lifecycle_check(p_event_id,p_result);
 v:=p_result->>'outcome';
 update private.cakto_payment_jobs set state=case when v='retry' and j.attempts=8 then 'exhausted' else v end,
  lease_token=null,lease_until=null,next_attempt_at=t+make_interval(secs=>least(3600,60*(2^(j.attempts-1))::integer)),updated_at=t where event_id=p_event_id;
end;$$;

revoke all on function public.resolve_cakto_lifecycle_binding(bigint,uuid,uuid) from public,anon,authenticated,service_role;
revoke all on function public.record_cakto_lifecycle_check(bigint,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.finish_cakto_lifecycle_job(bigint,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.resolve_cakto_lifecycle_binding(bigint,uuid,uuid) to service_role;
grant execute on function public.record_cakto_lifecycle_check(bigint,jsonb) to service_role;
grant execute on function public.finish_cakto_lifecycle_job(bigint,uuid,jsonb) to service_role;

create or replace function public.lease_cakto_payment_job(p_product_id text,p_offer_ids text[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j private.cakto_payment_jobs; t timestamptz:=clock_timestamp();
begin
 if p_product_id is null or p_product_id !~ '^[A-Za-z0-9_-]{1,200}$' or p_offer_ids is null or cardinality(p_offer_ids) not between 1 and 10 or
   exists(select 1 from unnest(p_offer_ids) o where o is null or o !~ '^[A-Za-z0-9_-]{1,200}$') then raise exception 'invalid_job_config';end if;
 insert into private.cakto_payment_jobs(event_id,next_attempt_at)
 select s.id,t from private.cakto_event_inbox s where s.product_id=p_product_id and s.offer_id=any(p_offer_ids)
  and s.event in('purchase_approved','subscription_created','purchase_refused','refund','refund_requested','chargeback','subscription_canceled','subscription_renewed','subscription_renewal_refused','subscription_paused','subscription_resumed','subscription_late','subscription_late_recovered') and not exists(select 1 from private.cakto_payment_jobs q where q.event_id=s.id)
 order by s.received_at,s.id limit 100 on conflict(event_id) do nothing;
 update private.cakto_payment_jobs q set state='exhausted',lease_token=null,lease_until=null,updated_at=t
 where q.attempts=8 and q.state='running' and q.lease_until<=t and exists(select 1 from private.cakto_event_inbox s where s.id=q.event_id and s.product_id=p_product_id and s.offer_id=any(p_offer_ids));
 select q.* into j from private.cakto_payment_jobs q join private.cakto_event_inbox s on s.id=q.event_id
 where s.product_id=p_product_id and s.offer_id=any(p_offer_ids) and q.attempts<8 and
  ((q.state in('queued','retry') and q.next_attempt_at<=t) or (q.state='running' and q.lease_until<=t))
 order by s.received_at,s.id for update of q skip locked limit 1;
 if not found then return null;end if;
 update private.cakto_payment_jobs set state='running',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=t+interval '2 minutes',updated_at=t
 where event_id=j.event_id returning * into j;
 return jsonb_build_object('eventId',j.event_id,'leaseToken',j.lease_token,'attempt',j.attempts);
end;$$;
