alter table private.cakto_event_inbox add column source text not null default 'webhook' check(source in('webhook','api_reconciliation'));
create table private.cakto_payment_jobs (
 event_id bigint primary key references private.cakto_event_inbox(id) on delete cascade,
 state text not null default 'queued' check(state in('queued','running','verified','review','retry','exhausted')),
 attempts integer not null default 0 check(attempts between 0 and 8),
 next_attempt_at timestamptz not null default clock_timestamp(),
 lease_token uuid,
 lease_until timestamptz,
 updated_at timestamptz not null default clock_timestamp(),
 check((state='running' and lease_token is not null and lease_until is not null) or (state<>'running' and lease_token is null and lease_until is null))
);
alter table private.cakto_payment_jobs enable row level security;
revoke all on private.cakto_payment_jobs from public,anon,authenticated,service_role;
create index cakto_payment_jobs_ready_idx on private.cakto_payment_jobs(state,next_attempt_at,lease_until);

create function public.cakto_reconciliation_window() returns jsonb
language sql security definer set search_path='' as $$
 select jsonb_build_object('since',clock_timestamp()-interval '7 days','until',clock_timestamp());
$$;

-- Source is an API consultation, not a claim that a webhook was authenticated.
create function public.enqueue_cakto_api_order(p_order_id uuid,p_subscription_id uuid,p_product_id text,p_offer_id text,p_reference text) returns boolean
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

create function public.lease_cakto_payment_job(p_product_id text,p_offer_ids text[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j private.cakto_payment_jobs; t timestamptz:=clock_timestamp();
begin
 if p_product_id is null or p_product_id !~ '^[A-Za-z0-9_-]{1,200}$' or p_offer_ids is null or cardinality(p_offer_ids) not between 1 and 10 or
   exists(select 1 from unnest(p_offer_ids) o where o is null or o !~ '^[A-Za-z0-9_-]{1,200}$') then raise exception 'invalid_job_config';end if;
 insert into private.cakto_payment_jobs(event_id,next_attempt_at)
 select s.id,t from private.cakto_event_inbox s where s.product_id=p_product_id and s.offer_id=any(p_offer_ids)
  and s.event in('purchase_approved','subscription_created') and not exists(select 1 from private.cakto_payment_jobs q where q.event_id=s.id)
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

create function public.finish_cakto_payment_job(p_event_id bigint,p_lease_token uuid,p_result jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare j private.cakto_payment_jobs; t timestamptz:=clock_timestamp(); v text;
begin
 select * into j from private.cakto_payment_jobs where event_id=p_event_id for update;
 if not found or j.state<>'running' or j.lease_token is distinct from p_lease_token or j.lease_until<=t then raise exception 'lease_invalid';end if;
 -- Evidence and final job state commit atomically. Failed persistence leaves lease recoverable.
 perform public.record_cakto_payment_check(p_event_id,p_result);
 v:=p_result->>'outcome';
 update private.cakto_payment_jobs set state=case when v='retry' and j.attempts=8 then 'exhausted' else v end,
  lease_token=null,lease_until=null,next_attempt_at=t+make_interval(secs=>least(3600,60*(2^(j.attempts-1))::integer)),updated_at=t
 where event_id=p_event_id;
end;$$;

create function public.requeue_cakto_payment_job(p_event_id bigint) returns void
language plpgsql security definer set search_path='' as $$
begin
 update private.cakto_payment_jobs set state='queued',attempts=0,next_attempt_at=clock_timestamp(),updated_at=clock_timestamp()
 where event_id=p_event_id and state in('review','exhausted');
 if not found then raise exception 'job_not_requeueable';end if;
end;$$;

create function public.cakto_payment_job_summary(p_product_id text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('queued',count(*) filter(where q.state='queued'),'running',count(*) filter(where q.state='running'),
  'verified',count(*) filter(where q.state='verified'),'review',count(*) filter(where q.state='review'),
  'retry',count(*) filter(where q.state='retry'),'exhausted',count(*) filter(where q.state='exhausted'))
 from private.cakto_payment_jobs q join private.cakto_event_inbox s on s.id=q.event_id where s.product_id=p_product_id;
$$;

revoke all on function public.cakto_reconciliation_window() from public,anon,authenticated,service_role;
revoke all on function public.enqueue_cakto_api_order(uuid,uuid,text,text,text) from public,anon,authenticated,service_role;
revoke all on function public.lease_cakto_payment_job(text,text[]) from public,anon,authenticated,service_role;
revoke all on function public.finish_cakto_payment_job(bigint,uuid,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.requeue_cakto_payment_job(bigint) from public,anon,authenticated,service_role;
revoke all on function public.cakto_payment_job_summary(text) from public,anon,authenticated,service_role;
grant execute on function public.cakto_reconciliation_window() to service_role;
grant execute on function public.enqueue_cakto_api_order(uuid,uuid,text,text,text) to service_role;
grant execute on function public.lease_cakto_payment_job(text,text[]) to service_role;
grant execute on function public.finish_cakto_payment_job(bigint,uuid,jsonb) to service_role;
grant execute on function public.requeue_cakto_payment_job(bigint) to service_role;
grant execute on function public.cakto_payment_job_summary(text) to service_role;
