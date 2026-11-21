-- Expand-only queue metadata; existing workers can finish results without dependency context.
alter table private.cakto_payment_jobs add column dependency_subscription_id uuid,
 add column dependency_origin_order_id uuid;

create or replace function public.finish_cakto_lifecycle_job(p_event_id bigint,p_lease_token uuid,p_result jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare j private.cakto_payment_jobs;t timestamptz:=clock_timestamp();v text;d jsonb;sub uuid;origin_id uuid;
begin
 select * into j from private.cakto_payment_jobs where event_id=p_event_id for update;
 if not found or j.state<>'running' or j.lease_token is distinct from p_lease_token or j.lease_until<=t then raise exception 'lease_invalid';end if;
 if p_result ? 'dependency' then
  d:=p_result->'dependency';
  if p_result->>'reason'<>'subscription_binding_missing' or p_result->>'outcome'<>all(array['retry','review'])
   or jsonb_typeof(d)<>'object' or not d ?& array['subscriptionId','originOrderId']
   or (select count(*) from jsonb_object_keys(d))<>2
   or jsonb_typeof(d->'subscriptionId')<>'string' or jsonb_typeof(d->'originOrderId')<>'string' then raise exception 'invalid_dependency';end if;
  sub:=(d->>'subscriptionId')::uuid;origin_id:=(d->>'originOrderId')::uuid;
  if sub is null or origin_id is null then raise exception 'invalid_dependency';end if;
 end if;
 -- Context schedules another authoritative check. It is never proof of ownership/payment.
 perform public.record_cakto_lifecycle_check(p_event_id,p_result-'dependency');
 v:=p_result->>'outcome';
 update private.cakto_payment_jobs set state=case when v='retry' and j.attempts=8 then 'exhausted' else v end,
  dependency_subscription_id=sub,dependency_origin_order_id=origin_id,
  lease_token=null,lease_until=null,next_attempt_at=t+make_interval(secs=>least(3600,60*(2^(j.attempts-1))::integer)),updated_at=t
 where event_id=p_event_id;
end;$$;
revoke all on function public.finish_cakto_lifecycle_job(bigint,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.finish_cakto_lifecycle_job(bigint,uuid,jsonb) to service_role;

create or replace function public.record_cakto_lifecycle_check(p_event_id bigint,p_result jsonb) returns void
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
   r->>'currency'<>'BRL' or e->>'action'<>'preserve' or e->>'orderStatus'<>'paid' or e->>'providerStatus'<>all(array['active','canceled']) then raise exception 'invalid_renewal';end if;
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

create function private.wake_cakto_dependency_jobs(p_subscription_id uuid,p_origin_order_id uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 with ready as (select j.event_id from private.cakto_payment_jobs j join private.cakto_event_inbox e on e.id=j.event_id
 where e.id=j.event_id and j.state in('retry','review','exhausted')
 and (
  (j.dependency_subscription_id=p_subscription_id and j.dependency_origin_order_id=p_origin_order_id)
  or (j.dependency_subscription_id is null and (e.details->>'subscriptionId'=p_subscription_id::text or e.order_id=p_origin_order_id::text))
 )
 and (select l.reason from private.cakto_lifecycle_checks l where l.event_id=j.event_id order by l.id desc limit 1)='subscription_binding_missing'
 for update of j skip locked)
 update private.cakto_payment_jobs j set state='queued',attempts=0,next_attempt_at=clock_timestamp(),updated_at=clock_timestamp()
 from ready where ready.event_id=j.event_id;
end;$$;
revoke all on function private.wake_cakto_dependency_jobs(uuid,uuid) from public,anon,authenticated,service_role;

create function private.wake_cakto_dependencies_after_period() returns trigger
language plpgsql security definer set search_path='' as $$
declare external_id uuid;origin_id uuid;
begin
 select c.subscription_id,c.order_id::uuid into external_id,origin_id
 from private.cakto_payment_checks c where c.id=new.first_check_id and c.outcome='verified';
 if found then perform private.wake_cakto_dependency_jobs(external_id,origin_id);end if;
 return new;
end;$$;
revoke all on function private.wake_cakto_dependencies_after_period() from public,anon,authenticated,service_role;
create trigger cakto_period_wake_dependencies after insert on private.cakto_access_periods
for each row execute function private.wake_cakto_dependencies_after_period();

-- One-time recovery of old missing-binding jobs when the prerequisite already exists.
do $$declare c record;begin
 for c in select distinct subscription_id,order_id from private.cakto_payment_checks where outcome='verified' loop
  perform private.wake_cakto_dependency_jobs(c.subscription_id,c.order_id::uuid);
 end loop;
end;$$;

-- Old cancelled-after-payment checks are rechecked once, never approved by migration.
update private.cakto_payment_jobs j set state='queued',attempts=0,next_attempt_at=clock_timestamp(),updated_at=clock_timestamp()
where j.state in('review','exhausted') and
 (select c.reason from private.cakto_payment_checks c where c.event_id=j.event_id order by c.id desc limit 1)='not_paid_or_reversed';

-- Rollback: redeploy old worker first, restore both public function definitions from
-- 20261006200000/20261009180000, then drop the wake trigger/functions. Nullable columns
-- may remain. Do not delete receipts, access periods, payment checks or customer data.
