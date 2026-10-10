-- Diagnóstico agregado, sem identificadores comerciais, credenciais ou dados pessoais.
create table private.cakto_operational_alerts (
 code text primary key check(code in('scheduler_inactive','automation_stalled','automation_failed','queue_stalled','payments_review','payments_exhausted')),
 first_seen_at timestamptz not null,last_seen_at timestamptz not null,resolved_at timestamptz,
 occurrences integer not null default 1 check(occurrences>0)
);
create table private.cakto_monitor_state (
 id boolean primary key default true check(id),checked_at timestamptz
);
insert into private.cakto_monitor_state(id) values(true);
alter table private.cakto_operational_alerts enable row level security;
alter table private.cakto_monitor_state enable row level security;
revoke all on private.cakto_operational_alerts,private.cakto_monitor_state from public,anon,authenticated,service_role;

create function private.cakto_health_snapshot() returns jsonb
language plpgsql security definer set search_path='' as $$
declare a private.cakto_automation;t timestamptz:=clock_timestamp();q jsonb;
 alerts jsonb:='[]';oldest timestamptz;review_count bigint;exhausted_count bigint;scheduler_active boolean;
begin
 select * into a from private.cakto_automation where id;
 select exists(select 1 from cron.job where jobname='meta-cakto-reconcile' and active) into scheduler_active;
 -- Ready age uses next_attempt_at: a deliberate retry wait does not look stalled.
 with eligible as (
  select e.received_at,j.state,j.next_attempt_at,j.lease_until,j.attempts,
   case when j.event_id is null then e.received_at
    when j.state in('queued','retry') and j.attempts<8 and j.next_attempt_at<=t then j.next_attempt_at
    when j.state='running' and j.lease_until<=t then j.lease_until else null end as ready_at
  from private.cakto_event_inbox e left join private.cakto_payment_jobs j on j.event_id=e.id
  where e.product_id=a.product_id and e.offer_id=any(a.offer_ids)
   and e.event in('purchase_approved','subscription_created','purchase_refused','refund','refund_requested','chargeback','subscription_canceled','subscription_renewed','subscription_renewal_refused','subscription_paused','subscription_resumed','subscription_late','subscription_late_recovered')
 ) select jsonb_build_object('pending',count(*) filter(where state is null),'queued',count(*) filter(where state='queued'),
  'running',count(*) filter(where state='running'),'verified',count(*) filter(where state='verified'),
  'review',count(*) filter(where state='review'),'retry',count(*) filter(where state='retry'),
  'exhausted',count(*) filter(where state='exhausted'),'expiredLeases',count(*) filter(where state='running' and lease_until<=t),
  'ready',count(ready_at),'oldestReadyAt',min(ready_at)),min(ready_at),
  count(*) filter(where state='review'),count(*) filter(where state='exhausted')
 into q,oldest,review_count,exhausted_count from eligible;
 if a.enabled and not scheduler_active then alerts:=alerts||'"scheduler_inactive"'::jsonb;end if;
 if a.enabled and a.next_discovery_at<t-interval '5 minutes' and not coalesce(a.lease_until>t,false) then alerts:=alerts||'"automation_stalled"'::jsonb;end if;
 if a.enabled and a.last_ok=false then alerts:=alerts||'"automation_failed"'::jsonb;end if;
 if a.enabled and oldest<t-interval '10 minutes' then alerts:=alerts||'"queue_stalled"'::jsonb;end if;
 if review_count>0 then alerts:=alerts||'"payments_review"'::jsonb;end if;
 if exhausted_count>0 then alerts:=alerts||'"payments_exhausted"'::jsonb;end if;
 return jsonb_build_object('sampledAt',t,'state',case when jsonb_array_length(alerts)>0 then 'attention' when not a.enabled then 'paused' else 'ok' end,
  'automation',jsonb_build_object('enabled',a.enabled,'running',coalesce(a.lease_until>t,false),'schedulerActive',scheduler_active,
   'lastFinishedAt',a.last_finished_at,'lastOk',a.last_ok,'nextDiscoveryAt',a.next_discovery_at),
  'queue',q,'alerts',alerts);
end;$$;

create function private.capture_cakto_health() returns void
language plpgsql security definer set search_path='' as $$
declare h jsonb;t timestamptz:=clock_timestamp();code_value text;
begin
 -- Serializes monitor samples; one row per known condition bounds storage.
 perform 1 from private.cakto_monitor_state where id for update;
 h:=private.cakto_health_snapshot();
 for code_value in select jsonb_array_elements_text(h->'alerts') loop
  insert into private.cakto_operational_alerts(code,first_seen_at,last_seen_at) values(code_value,t,t)
  on conflict(code) do update set first_seen_at=case when cakto_operational_alerts.resolved_at is null then cakto_operational_alerts.first_seen_at else t end,
   last_seen_at=t,resolved_at=null,occurrences=case when cakto_operational_alerts.resolved_at is null then cakto_operational_alerts.occurrences else least(2147483646,cakto_operational_alerts.occurrences)+1 end;
 end loop;
 update private.cakto_operational_alerts set resolved_at=t where resolved_at is null and not (h->'alerts' ? code);
 update private.cakto_monitor_state set checked_at=t where id;
end;$$;

create function public.cakto_operational_health() returns jsonb
language sql security definer set search_path='' as $$
 select private.cakto_health_snapshot()||jsonb_build_object('monitor',jsonb_build_object(
  'active',exists(select 1 from cron.job where jobname='meta-cakto-health' and active),
  'lastCheckedAt',(select checked_at from private.cakto_monitor_state where id)),
  'incidents',coalesce((select jsonb_agg(jsonb_build_object('code',code,'firstSeenAt',first_seen_at,'lastSeenAt',last_seen_at,'resolvedAt',resolved_at,'occurrences',occurrences) order by code)
   from private.cakto_operational_alerts),'[]'::jsonb));
$$;
revoke all on function private.cakto_health_snapshot(),private.capture_cakto_health(),public.cakto_operational_health() from public,anon,authenticated,service_role;
grant execute on function public.cakto_operational_health() to service_role;
-- Ativação do job somente após ensaio/testes; nenhum alerta é enviado a terceiros.
