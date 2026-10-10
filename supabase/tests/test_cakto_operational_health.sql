begin;
do $$
declare h jsonb;e bigint;j bigint;first_seen timestamptz;v text;prod text:='health-fixture';
begin
 delete from private.cakto_operational_alerts;
 j:=cron.schedule('meta-cakto-reconcile','* * * * *','select private.dispatch_cakto_automation();');perform cron.alter_job(j,active:=true);
 update private.cakto_automation set product_id=prod,offer_ids=array['offer'],enabled=false,last_ok=true,next_discovery_at=clock_timestamp()+interval '1 hour',lease_token=null,lease_until=null,lease_mode=null;
 h:=public.cakto_operational_health();if h->>'state'<>'paused' or h->'alerts'<>'[]'::jsonb then raise exception 'pause flagged as failure';end if;
 update private.cakto_automation set enabled=true;
 h:=public.cakto_operational_health();if h->>'state'<>'ok' then raise exception 'healthy queue not ok';end if;
 perform cron.alter_job(j,active:=false);h:=public.cakto_operational_health();if not (h->'alerts' ? 'scheduler_inactive') then raise exception 'scheduler failure missed';end if;
 perform cron.alter_job(j,active:=true);
 update private.cakto_automation set next_discovery_at=clock_timestamp()-interval '6 minutes',lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '1 minute',lease_mode='discovery';
 h:=public.cakto_operational_health();if h->'alerts' ? 'automation_stalled' then raise exception 'live worker flagged';end if;
 update private.cakto_automation set lease_until=clock_timestamp()-interval '1 second',last_ok=false;
 h:=public.cakto_operational_health();if not (h->'alerts' ?& array['automation_stalled','automation_failed']) then raise exception 'stalled failure missed';end if;
 perform private.capture_cakto_health();select first_seen_at into first_seen from private.cakto_operational_alerts where code='automation_failed';
 perform private.capture_cakto_health();if not exists(select 1 from private.cakto_operational_alerts where code='automation_failed' and first_seen_at=first_seen and occurrences=1 and resolved_at is null) then raise exception 'incident duplicated';end if;
 update private.cakto_automation set last_ok=true,next_discovery_at=clock_timestamp()+interval '1 hour',lease_token=null,lease_until=null,lease_mode=null;
 perform private.capture_cakto_health();if not exists(select 1 from private.cakto_operational_alerts where code='automation_failed' and resolved_at is not null) then raise exception 'incident not resolved';end if;
 update private.cakto_automation set last_ok=false;perform private.capture_cakto_health();if not exists(select 1 from private.cakto_operational_alerts where code='automation_failed' and occurrences=2 and resolved_at is null) then raise exception 'recurrence missed';end if;
 update private.cakto_automation set last_ok=true;
 insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details,received_at)
 values(encode(extensions.digest(gen_random_uuid()::text,'sha256'),'hex'),'purchase_approved',gen_random_uuid()::text,prod,'offer','{}',clock_timestamp()-interval '11 minutes') returning id into e;
 h:=public.cakto_operational_health();if not (h->'alerts' ? 'queue_stalled') or (h->'queue'->>'pending')::int<>1 then raise exception 'unleased signal missed';end if;
 insert into private.cakto_payment_jobs(event_id,state,attempts,next_attempt_at) values(e,'retry',1,clock_timestamp()+interval '1 hour');
 h:=public.cakto_operational_health();if h->'alerts' ? 'queue_stalled' or (h->'queue'->>'ready')::int<>0 then raise exception 'retry delay flagged';end if;
 update private.cakto_payment_jobs set next_attempt_at=clock_timestamp()-interval '11 minutes' where event_id=e;
 if not (public.cakto_operational_health()->'alerts' ? 'queue_stalled') then raise exception 'retry stuck missed';end if;
 update private.cakto_payment_jobs set state='running',lease_token=gen_random_uuid(),lease_until=clock_timestamp()-interval '11 minutes' where event_id=e;
 h:=public.cakto_operational_health();if (h->'queue'->>'expiredLeases')::int<>1 or not(h->'alerts' ? 'queue_stalled') then raise exception 'expired lease missed';end if;
 update private.cakto_payment_jobs set state='review',lease_token=null,lease_until=null where event_id=e;
 h:=public.cakto_operational_health();if not (h->'alerts' ? 'payments_review') or h->'alerts' ? 'queue_stalled' then raise exception 'review incorrectly classified';end if;
 update private.cakto_payment_jobs set state='exhausted',attempts=8 where event_id=e;
 if not (public.cakto_operational_health()->'alerts' ? 'payments_exhausted') then raise exception 'exhausted job missed';end if;
 update private.cakto_automation set enabled=false;h:=public.cakto_operational_health();if not (h->'alerts' ? 'payments_exhausted') then raise exception 'pause hid review';end if;
 -- Non-allowlisted products/offers never enter the report.
 update private.cakto_event_inbox set offer_id='foreign' where id=e;
 h:=public.cakto_operational_health();if h->'alerts'<>'[]'::jsonb or (h->'queue'->>'exhausted')::int<>0 then raise exception 'foreign offer counted';end if;
 if h::text ~ 'health-fixture|foreign|orderId|reference|secret|customer' then raise exception 'private fields leaked';end if;
 perform private.capture_cakto_health();if (select checked_at from private.cakto_monitor_state where id) is null then raise exception 'monitor not recorded';end if;
 foreach v in array array['anon','authenticated'] loop
  if has_function_privilege(v,'public.cakto_operational_health()','execute') or has_table_privilege(v,'private.cakto_operational_alerts','select') or has_function_privilege(v,'private.capture_cakto_health()','execute') then raise exception 'client permissions';end if;
 end loop;
 if has_table_privilege('service_role','private.cakto_monitor_state','select,update') or has_function_privilege('service_role','private.cakto_health_snapshot()','execute') or not has_function_privilege('service_role','public.cakto_operational_health()','execute') then raise exception 'server permissions';end if;
end$$;
select true as health_stall_review_recovery_privacy_permissions_passed;
rollback;
