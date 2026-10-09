create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table private.cakto_automation (
 id boolean primary key default true check(id),enabled boolean not null default false,
 endpoint text check(endpoint ~ '^https://[a-z0-9]{20}\.supabase\.co/functions/v1/cakto-reconcile$'),
 secret_id uuid,product_id text,offer_ids text[],
 next_discovery_at timestamptz not null default clock_timestamp(),scan_since timestamptz,scan_until timestamptz,
 scan_page integer not null default 1 check(scan_page between 1 and 100),scan_offset integer not null default 0 check(scan_offset between 0 and 4),
 lease_token uuid,lease_until timestamptz,lease_mode text check(lease_mode in('jobs','discovery')),
 last_dispatched_at timestamptz,last_finished_at timestamptz,last_ok boolean,last_summary jsonb,
 check((lease_token is null and lease_until is null and lease_mode is null) or (lease_token is not null and lease_until is not null and lease_mode is not null)),
 check((scan_since is null and scan_until is null) or (scan_since is not null and scan_until>scan_since))
);
insert into private.cakto_automation(id) values(true);
alter table private.cakto_automation enable row level security;
revoke all on private.cakto_automation from public,anon,authenticated,service_role;

create function public.lease_cakto_automation() returns jsonb
language plpgsql security definer set search_path='' as $$
declare a private.cakto_automation;t timestamptz:=clock_timestamp();m text;
begin
 select * into a from private.cakto_automation where id for update;
 if not a.enabled or a.lease_until>t then return null;end if;
 if a.product_id is null or a.product_id !~ '^[A-Za-z0-9_-]{1,200}$' or a.offer_ids is null or cardinality(a.offer_ids) not between 1 and 10 or
 exists(select 1 from unnest(a.offer_ids) o where o is null or o !~ '^[A-Za-z0-9_-]{1,200}$') then raise exception 'automation_unconfigured';end if;
 m:=case when a.next_discovery_at<=t then 'discovery' else 'jobs' end;
 update private.cakto_automation set lease_token=gen_random_uuid(),lease_until=t+interval '2 minutes',lease_mode=m,
 scan_since=case when m='discovery' then coalesce(scan_since,t-interval '7 days') else scan_since end,
 scan_until=case when m='discovery' then coalesce(scan_until,t) else scan_until end where id returning * into a;
 return jsonb_build_object('token',a.lease_token,'mode',m,'product',a.product_id,'offers',a.offer_ids,
 'since',a.scan_since,'until',a.scan_until,'page',a.scan_page,'offset',a.scan_offset);
end;$$;

create function public.finish_cakto_automation(p_token uuid,p_ok boolean,p_summary jsonb,p_page integer default null,p_offset integer default null,p_done boolean default false) returns void
language plpgsql security definer set search_path='' as $$
declare a private.cakto_automation;t timestamptz:=clock_timestamp();k text;
begin
 select * into a from private.cakto_automation where id for update;
 if a.lease_token is distinct from p_token or a.lease_until<=t or p_token is null or a.lease_token is null then raise exception 'automation_lease_invalid';end if;
 if p_ok is null or p_done is null or p_summary is null or jsonb_typeof(p_summary)<>'object' then raise exception 'automation_summary_invalid';end if;
 for k in select jsonb_object_keys(p_summary) loop
  if k<>all(array['processed','verified','review','retry','failed','matched','ignored','truncated']) or jsonb_typeof(p_summary->k)<>'number' or p_summary->>k !~ '^[0-5]$' then raise exception 'automation_summary_invalid';end if;
 end loop;
 if a.lease_mode='discovery' and p_ok and not p_done and
 (p_page is null or p_offset is null or not ((p_page=a.scan_page and p_offset=a.scan_offset+1 and p_offset<=4) or (p_page=a.scan_page+1 and p_page<=100 and p_offset=0))) then raise exception 'automation_cursor_invalid';end if;
 update private.cakto_automation set last_finished_at=t,last_ok=p_ok,last_summary=p_summary,
 scan_since=case when lease_mode='discovery' and p_ok and p_done then null else scan_since end,
 scan_until=case when lease_mode='discovery' and p_ok and p_done then null else scan_until end,
 scan_page=case when lease_mode='discovery' and p_ok then case when p_done then 1 else p_page end else scan_page end,
 scan_offset=case when lease_mode='discovery' and p_ok then case when p_done then 0 else p_offset end else scan_offset end,
 next_discovery_at=case when lease_mode='discovery' then case when not p_ok then t+interval '5 minutes' when p_done then t+interval '15 minutes' else t+interval '1 minute' end else next_discovery_at end,
 lease_token=null,lease_until=null,lease_mode=null where id;
end;$$;

create function private.dispatch_cakto_automation() returns bigint
language plpgsql security definer set search_path='' as $$
declare a private.cakto_automation;t timestamptz:=clock_timestamp();secret_value text;request_value bigint;
begin
 select * into a from private.cakto_automation where id for update;
 if not a.enabled or a.lease_until>t or a.last_dispatched_at>t-interval '50 seconds' then return null;end if;
 if a.next_discovery_at>t and not exists(
 select 1 from private.cakto_payment_jobs q join private.cakto_event_inbox e on e.id=q.event_id
 where e.product_id=a.product_id and e.offer_id=any(a.offer_ids) and ((q.attempts<8 and q.state in('queued','retry') and q.next_attempt_at<=t) or (q.state='running' and q.lease_until<=t))
 ) and not exists(
 select 1 from private.cakto_event_inbox e where e.product_id=a.product_id and e.offer_id=any(a.offer_ids)
 and e.event in('purchase_approved','subscription_created','purchase_refused','refund','refund_requested','chargeback','subscription_canceled','subscription_renewed','subscription_renewal_refused','subscription_paused','subscription_resumed','subscription_late','subscription_late_recovered')
 and not exists(select 1 from private.cakto_payment_jobs q where q.event_id=e.id)
 ) then return null;end if;
 select decrypted_secret into secret_value from vault.decrypted_secrets where id=a.secret_id;
 if secret_value is null or secret_value !~ '^[a-f0-9]{64}$' or a.endpoint is null then raise exception 'automation_unconfigured';end if;
 request_value:=net.http_post(url:=a.endpoint,body:='{}'::jsonb,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||secret_value),timeout_milliseconds:=120000);
 update private.cakto_automation set last_dispatched_at=t where id;
 return request_value;
end;$$;

create function public.cakto_automation_status() returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('enabled',enabled,'running',coalesce(lease_until>clock_timestamp(),false),'lastDispatchedAt',last_dispatched_at,'lastFinishedAt',last_finished_at,
 'lastOk',last_ok,'summary',last_summary,'nextDiscoveryAt',next_discovery_at,'page',scan_page,'offset',scan_offset) from private.cakto_automation where id;
$$;
revoke all on function private.dispatch_cakto_automation() from public,anon,authenticated,service_role;
revoke all on function public.lease_cakto_automation(),public.finish_cakto_automation(uuid,boolean,jsonb,integer,integer,boolean),public.cakto_automation_status() from public,anon,authenticated,service_role;
grant execute on function public.lease_cakto_automation(),public.finish_cakto_automation(uuid,boolean,jsonb,integer,integer,boolean),public.cakto_automation_status() to service_role;
-- Não agendar nem armazenar credenciais na migration: ativação só depois do teste da função publicada.
