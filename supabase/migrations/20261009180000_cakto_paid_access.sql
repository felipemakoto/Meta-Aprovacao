-- App policy: each independently verified monthly payment acquires 720 hours.
alter table private.subscriptions add column access_policy text not null default 'legacy' check(access_policy in('legacy','cakto_30_days'));
create table private.cakto_access_periods (
 order_id uuid primary key,
 subscription_id uuid not null references private.subscriptions(id) on delete cascade,
 first_check_id bigint not null references private.cakto_payment_checks(id) on delete cascade,
 period integer not null check(period between 1 and 10000),
 paid_at timestamptz not null check(isfinite(paid_at)),
 access_from timestamptz not null check(isfinite(access_from)),
 access_until timestamptz not null check(isfinite(access_until)),
 revoked_at timestamptz check(revoked_at is null or isfinite(revoked_at)),
 created_at timestamptz not null default clock_timestamp(),
 unique(subscription_id,period),
 check(access_until=access_from+interval '720 hours' and access_from>=paid_at)
);
create table private.cakto_renewal_payments (
 order_id uuid primary key,
 event_id bigint not null references private.cakto_event_inbox(id) on delete cascade,
 first_check_id bigint not null references private.cakto_payment_checks(id) on delete cascade,
 period integer not null check(period between 2 and 10000),
 order_created_at timestamptz not null check(isfinite(order_created_at)),
 paid_at timestamptz not null check(isfinite(paid_at) and paid_at>=order_created_at),
 paid_price_cents integer not null check(paid_price_cents=2299),
 currency text not null check(currency='BRL'),
 checked_at timestamptz not null default clock_timestamp(),
 unique(first_check_id,period)
);
alter table private.cakto_access_periods enable row level security;
create index cakto_access_periods_live_idx on private.cakto_access_periods(subscription_id,access_from,access_until) where revoked_at is null;
alter table private.cakto_renewal_payments enable row level security;
revoke all on private.cakto_access_periods,private.cakto_renewal_payments from public,anon,authenticated,service_role;

create function private.refresh_cakto_access(p_subscription_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare a timestamptz;b timestamptz;o uuid;
begin
 select min(access_from),max(access_until) into a,b from private.cakto_access_periods where subscription_id=p_subscription_id and revoked_at is null;
 select order_id into o from private.cakto_access_periods where subscription_id=p_subscription_id and revoked_at is null order by period desc limit 1;
 if a is null then
  update private.subscriptions set access_state='revoked',last_synced_at=clock_timestamp() where id=p_subscription_id and access_policy='cakto_30_days';
 else
  update private.subscriptions set access_state='granted',access_from=a,access_until=b,last_verified_order_id=o::text,last_verified_at=clock_timestamp(),last_synced_at=clock_timestamp()
  where id=p_subscription_id and access_policy='cakto_30_days';
 end if;
end;$$;

create function private.apply_cakto_paid_period(p_event_id bigint,p_first_check_id bigint,p_order_id uuid,p_period integer,p_paid_at timestamptz) returns void
language plpgsql security definer set search_path='' as $$
declare c private.cakto_payment_checks;i private.checkout_intents;s private.cakto_event_inbox;local_sub private.subscriptions;
 prev private.cakto_access_periods;existing private.cakto_access_periods;start_at timestamptz;
begin
 select * into c from private.cakto_payment_checks where id=p_first_check_id and outcome='verified';
 if not found then raise exception 'payment_proof_missing';end if;
 select * into i from private.checkout_intents where reference=c.intent_reference and provider='cakto';
 select * into s from private.cakto_event_inbox where id=p_event_id;
 if i.reference is null or s.id is null or i.product_id<>s.product_id or i.offer_id<>s.offer_id or s.order_id<>p_order_id::text or
  not exists(select 1 from auth.users where id=i.user_id and email_confirmed_at is not null) or p_period not between 1 and 10000 or p_period is null or
  p_paid_at is null or not isfinite(p_paid_at) or p_paid_at>clock_timestamp() then raise exception 'paid_period_invalid';end if;
 perform pg_advisory_xact_lock(hashtextextended('cakto-lifecycle:'||c.subscription_id::text,0));
 if p_period=1 and (c.order_id<>p_order_id::text or c.paid_at<>p_paid_at) then raise exception 'paid_period_invalid';end if;
 if exists(select 1 from private.cakto_lifecycle_checks l join private.cakto_event_inbox e on e.id=l.event_id
  where l.subscription_id=c.subscription_id and l.outcome='verified' and l.action='revoke' and e.order_id=p_order_id::text) then return;end if;
 insert into private.subscriptions(user_id,provider,external_subscription_id,external_product_id,external_plan_id,provider_status)
 values(i.user_id,'cakto',c.subscription_id::text,i.product_id,i.offer_id,'active') on conflict(provider,external_subscription_id) do nothing;
 select * into local_sub from private.subscriptions where provider='cakto' and external_subscription_id=c.subscription_id::text for update;
 if local_sub.user_id<>i.user_id or local_sub.external_product_id<>i.product_id or local_sub.external_plan_id is distinct from i.offer_id then raise exception 'subscription_identity_conflict';end if;
 select * into existing from private.cakto_access_periods where order_id=p_order_id;
 if found then
  if existing.subscription_id<>local_sub.id or existing.period<>p_period or existing.paid_at<>p_paid_at or existing.first_check_id<>c.id then raise exception 'paid_period_conflict';end if;
  return; -- A repeated payment cannot extend or resurrect an existing interval.
 end if;
 if p_period=1 then start_at:=p_paid_at;
 else
  select * into prev from private.cakto_access_periods where subscription_id=local_sub.id and period=p_period-1;
  if not found or p_paid_at<prev.paid_at then raise exception 'previous_paid_period_missing';end if;
  start_at:=case when prev.revoked_at is not null then p_paid_at else greatest(prev.access_until,p_paid_at) end;
 end if;
 insert into private.cakto_access_periods(order_id,subscription_id,first_check_id,period,paid_at,access_from,access_until)
 values(p_order_id,local_sub.id,c.id,p_period,p_paid_at,start_at,start_at+interval '720 hours');
 update private.subscriptions set access_policy='cakto_30_days' where id=local_sub.id;
 perform private.refresh_cakto_access(local_sub.id);
end;$$;

-- Existing evidence validation stays intact. Evidence and first grant now share a transaction.
alter function public.record_cakto_payment_check(bigint,jsonb) set schema private;
revoke all on function private.record_cakto_payment_check(bigint,jsonb) from public,anon,authenticated,service_role;
create function public.record_cakto_payment_check(p_event_id bigint,p_result jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare c private.cakto_payment_checks;
begin
 perform private.record_cakto_payment_check(p_event_id,p_result);
 if p_result->>'outcome'='verified' then
  select pc.* into c from private.cakto_payment_checks pc join private.cakto_event_inbox e on e.id=p_event_id and e.order_id=pc.order_id where pc.outcome='verified';
  perform private.apply_cakto_paid_period(p_event_id,c.id,c.order_id::uuid,1,c.paid_at);
 end if;
end;$$;

create or replace function public.resolve_cakto_lifecycle_binding(p_event_id bigint,p_subscription_id uuid,p_origin_order_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('subscriptionId',c.subscription_id,'originOrderId',c.order_id,'productId',i.product_id,'offerId',i.offer_id,
 'expectedPeriod',coalesce((select p.period from private.cakto_access_periods p where p.order_id::text=s.order_id),
  (select coalesce(max(p.period),0)+1 from private.cakto_access_periods p where p.first_check_id=c.id)))
 from private.cakto_payment_checks c join private.checkout_intents i on i.reference=c.intent_reference and i.provider='cakto'
 join auth.users u on u.id=i.user_id and u.email_confirmed_at is not null
 join private.cakto_event_inbox s on s.id=p_event_id and s.product_id=i.product_id and s.offer_id=i.offer_id
 where c.outcome='verified' and c.subscription_id=p_subscription_id and c.order_id=p_origin_order_id::text;
$$;

alter function public.record_cakto_lifecycle_check(bigint,jsonb) set schema private;
revoke all on function private.record_cakto_lifecycle_check(bigint,jsonb) from public,anon,authenticated,service_role;
create function public.record_cakto_lifecycle_check(p_event_id bigint,p_result jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare r jsonb;e jsonb;k text;c private.cakto_payment_checks;p private.cakto_renewal_payments;
 order_value uuid;period_value integer;paid_value timestamptz;created_value timestamptz;local_id uuid;
begin
 perform 1 from private.cakto_event_inbox where id=p_event_id for update;
 if p_result ? 'renewal' then
  if p_result->>'outcome'<>'verified' or p_result->>'reason'<>'lifecycle_observed' or jsonb_typeof(p_result->'renewal')<>'object' then raise exception 'invalid_renewal';end if;
  r:=p_result->'renewal';e:=p_result->'snapshot';
  if not r ?& array['orderId','period','orderCreatedAt','paidAt','paidPriceCents','currency'] then raise exception 'invalid_renewal';end if;
  for k in select jsonb_object_keys(r) loop if k<>all(array['orderId','period','orderCreatedAt','paidAt','paidPriceCents','currency']) then raise exception 'private_or_unknown_field';end if;end loop;
  foreach k in array array['orderId','orderCreatedAt','paidAt','currency'] loop if jsonb_typeof(r->k)<>'string' then raise exception 'invalid_renewal';end if;end loop;
  if jsonb_typeof(r->'period')<>'number' or r->>'period' !~ '^[0-9]{1,5}$' or jsonb_typeof(r->'paidPriceCents')<>'number' or r->>'paidPriceCents'<>'2299' or
   r->>'currency'<>'BRL' or e->>'action'<>'preserve' or e->>'orderStatus'<>'paid' or e->>'providerStatus'<>'active' then raise exception 'invalid_renewal';end if;
  order_value:=(r->>'orderId')::uuid;period_value:=(r->>'period')::integer;paid_value:=(r->>'paidAt')::timestamptz;created_value:=(r->>'orderCreatedAt')::timestamptz;
  if period_value not between 2 and 10000 or not isfinite(paid_value) or not isfinite(created_value) or paid_value<created_value or paid_value>clock_timestamp() or
   not exists(select 1 from private.cakto_event_inbox where id=p_event_id and order_id=order_value::text) then raise exception 'invalid_renewal';end if;
  select * into c from private.cakto_payment_checks where outcome='verified' and subscription_id=(e->>'subscriptionId')::uuid and order_id=e->>'originOrderId';
  if not found then raise exception 'subscription_binding_missing';end if;
  perform pg_advisory_xact_lock(hashtextextended('cakto-lifecycle:'||c.subscription_id::text,0));
  select * into p from private.cakto_renewal_payments where order_id=order_value;
  if found and (p.first_check_id<>c.id or p.period<>period_value or p.paid_at<>paid_value or p.order_created_at<>created_value) then raise exception 'renewal_identity_conflict';end if;
  insert into private.cakto_renewal_payments(order_id,event_id,first_check_id,period,order_created_at,paid_at,paid_price_cents,currency)
  values(order_value,p_event_id,c.id,period_value,created_value,paid_value,2299,'BRL') on conflict(order_id) do nothing;
  perform private.record_cakto_lifecycle_check(p_event_id,p_result-'renewal');
  perform private.apply_cakto_paid_period(p_event_id,c.id,order_value,period_value,paid_value);
 else
  perform private.record_cakto_lifecycle_check(p_event_id,p_result);
  e:=p_result->'snapshot';
  if p_result->>'outcome'='verified' and e->>'action'='revoke' then
   -- Same lock as grants. A refund punches a hole only in its own paid period.
   perform pg_advisory_xact_lock(hashtextextended('cakto-lifecycle:'||(e->>'subscriptionId'),0));
   select a.id into local_id from private.subscriptions a where a.provider='cakto' and a.external_subscription_id=e->>'subscriptionId' and a.access_policy='cakto_30_days';
   update private.cakto_access_periods set revoked_at=coalesce(revoked_at,(e->>'occurredAt')::timestamptz)
   where subscription_id=local_id and order_id::text=(select order_id from private.cakto_event_inbox where id=p_event_id);
   if local_id is not null then perform private.refresh_cakto_access(local_id);end if;
  end if;
 end if;
end;$$;

create function private.enqueue_cakto_api_order(p_order_id uuid,p_subscription_id uuid,p_product_id text,p_offer_id text,p_reference text) returns boolean
language plpgsql security definer set search_path='' as $$
declare r jsonb; f text;
begin
 if p_order_id is null or p_subscription_id is null or p_reference is null or p_reference !~ '^[a-f0-9]{64}$' or
   not exists(select 1 from private.checkout_intents i join auth.users u on u.id=i.user_id and u.email_confirmed_at is not null
    where i.reference=p_reference and i.provider='cakto' and i.product_id=p_product_id and i.offer_id=p_offer_id) then return false;end if;
 -- Signal contains only identifiers; the worker will consult the provider again.
 r:=jsonb_build_object('event','purchase_approved','orderId',p_order_id::text,'productId',p_product_id,'offerId',p_offer_id,'status','paid',
  'subscriptionId',p_subscription_id::text,'reference',p_reference,'paidAt',null,'refundedAt',null,'chargedbackAt',null,'canceledAt',null);
 f:=encode(extensions.digest(convert_to(r::text,'UTF8'),'sha256'),'hex');
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details,source)
 values(f,'purchase_approved',p_order_id::text,p_product_id,p_offer_id,r,'api_reconciliation') on conflict(fingerprint) do nothing;
 return true;
end;$$;

create or replace function public.enqueue_cakto_api_order(p_order_id uuid,p_subscription_id uuid,p_product_id text,p_offer_id text,p_reference text) returns boolean
language plpgsql security definer set search_path='' as $$
declare r jsonb;f text;
begin
 if p_reference is distinct from '' then return private.enqueue_cakto_api_order(p_order_id,p_subscription_id,p_product_id,p_offer_id,p_reference);end if;
 if p_order_id is null or p_subscription_id is null or not exists(
  select 1 from private.cakto_payment_checks c join private.checkout_intents i on i.reference=c.intent_reference and i.provider='cakto'
  join auth.users u on u.id=i.user_id and u.email_confirmed_at is not null
  where c.outcome='verified' and c.subscription_id=p_subscription_id and c.order_id<>p_order_id::text and i.product_id=p_product_id and i.offer_id=p_offer_id
 ) then return false;end if;
 r:=jsonb_build_object('event','subscription_renewed','orderId',p_order_id::text,'productId',p_product_id,'offerId',p_offer_id,'status','paid',
  'subscriptionId',p_subscription_id::text,'reference',null,'paidAt',null,'refundedAt',null,'chargedbackAt',null,'canceledAt',null);
 f:=encode(extensions.digest(convert_to(r::text,'UTF8'),'sha256'),'hex');
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details,source)
 values(f,'subscription_renewed',p_order_id::text,p_product_id,p_offer_id,r,'api_reconciliation') on conflict(fingerprint) do nothing;
 return true;
end;$$;
revoke all on function private.enqueue_cakto_api_order(uuid,uuid,text,text,text) from public,anon,authenticated,service_role;

create or replace function private.subscription_access(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp();until_at timestamptz;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 select max(case when s.access_policy='legacy' then s.access_until else
  (with recursive covered(until_at) as (
   select p.access_until from private.cakto_access_periods p where p.subscription_id=s.id and p.revoked_at is null and p.access_from<=t and p.access_until>t
   union
   select p.access_until from covered c join private.cakto_access_periods p on p.subscription_id=s.id and p.revoked_at is null and p.access_from<=c.until_at and p.access_until>c.until_at
  ) select max(covered.until_at) from covered) end)
 into until_at from private.subscriptions s where s.user_id=p_user_id and s.access_state='granted' and s.last_verified_at<=t and s.access_from<=t and s.access_until>t;
 return jsonb_build_object('hasPremium',until_at is not null,'accessUntil',until_at);
end;$$;
revoke all on function private.refresh_cakto_access(uuid) from public,anon,authenticated,service_role;
revoke all on function private.apply_cakto_paid_period(bigint,bigint,uuid,integer,timestamptz) from public,anon,authenticated,service_role;
revoke all on function private.subscription_access(uuid) from public,anon,authenticated,service_role;
revoke all on function public.record_cakto_payment_check(bigint,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.record_cakto_lifecycle_check(bigint,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.record_cakto_payment_check(bigint,jsonb) to service_role;
grant execute on function public.record_cakto_lifecycle_check(bigint,jsonb) to service_role;


