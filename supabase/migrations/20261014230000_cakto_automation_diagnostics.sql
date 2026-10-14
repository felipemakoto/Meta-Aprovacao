-- Diagnostic enums and HTTP status only; no raw error, IDs, response body or credentials.
create or replace function public.finish_cakto_automation(p_token uuid,p_ok boolean,p_summary jsonb,p_page integer default null,p_offset integer default null,p_done boolean default false) returns void
language plpgsql security definer set search_path='' as $$
declare a private.cakto_automation;t timestamptz:=clock_timestamp();k text;d jsonb;dk text;
begin
 select * into a from private.cakto_automation where id for update;
 if a.lease_token is distinct from p_token or a.lease_until<=t or p_token is null or a.lease_token is null then raise exception 'automation_lease_invalid';end if;
 if p_ok is null or p_done is null or p_summary is null or jsonb_typeof(p_summary)<>'object' then raise exception 'automation_summary_invalid';end if;
 for k in select jsonb_object_keys(p_summary) loop
  if k='diagnostic' then
   d:=p_summary->k;
   if p_ok or jsonb_typeof(d)<>'object' or not(d ?& array['phase','category']) then raise exception 'automation_summary_invalid';end if;
   for dk in select jsonb_object_keys(d) loop
    if dk<>all(array['phase','category','operation','status']) then raise exception 'automation_summary_invalid';end if;
   end loop;
   if jsonb_typeof(d->'phase')<>'string' or d->>'phase'<>all(array['lease','validation','discovery','jobs','finish']) or
    jsonb_typeof(d->'category')<>'string' or d->>'category'<>all(array['configuration_missing','provider_unauthorized','provider_rate_limited','provider_not_found','provider_invalid_response','provider_unavailable','provider_timeout','storage_unavailable','invalid_worker_state','internal_error']) then raise exception 'automation_summary_invalid';end if;
   if d ? 'operation' and (jsonb_typeof(d->'operation')<>'string' or d->>'operation'<>all(array['authentication','orders_list','order','subscription'])) then raise exception 'automation_summary_invalid';end if;
   if d ? 'status' and (jsonb_typeof(d->'status')<>'number' or d->>'status' !~ '^[1-5][0-9]{2}$') then raise exception 'automation_summary_invalid';end if;
   continue;
  end if;
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
