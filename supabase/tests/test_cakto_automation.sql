begin;
do $$
declare a jsonb;b jsonb;denied boolean;token uuid;
begin
 update private.cakto_automation set enabled=false,lease_token=null,lease_until=null,lease_mode=null,scan_since=null,scan_until=null,scan_page=1,scan_offset=0,next_discovery_at=clock_timestamp();
 if public.lease_cakto_automation() is not null or private.dispatch_cakto_automation() is not null then raise exception 'unconfigured scheduler ran';end if;
 update private.cakto_automation set enabled=true,product_id='automation-fixture',offer_ids=array['offer'];
 a:=public.lease_cakto_automation();token:=(a->>'token')::uuid;
 if a->>'mode'<>'discovery' or a->>'page'<>'1' or a->>'offset'<>'0' or public.lease_cakto_automation() is not null then raise exception 'lease exclusivity';end if;
 denied:=false;begin perform public.finish_cakto_automation(gen_random_uuid(),true,'{}',1,1,false);exception when raise_exception then denied:=sqlerrm='automation_lease_invalid';end;if not denied then raise exception 'foreign lease finished';end if;
 denied:=false;begin perform public.finish_cakto_automation(token,true,'{"secret":"private"}',1,1,false);exception when raise_exception then denied:=sqlerrm='automation_summary_invalid';end;if not denied then raise exception 'private summary accepted';end if;
 denied:=false;begin perform public.finish_cakto_automation(token,true,'{}',3,0,false);exception when raise_exception then denied:=sqlerrm='automation_cursor_invalid';end;if not denied then raise exception 'cursor skipped';end if;
 perform public.finish_cakto_automation(token,true,'{"matched":1}',1,1,false);
 a:=public.lease_cakto_automation();if a->>'mode'<>'jobs' then raise exception 'discovery monopolized queue';end if;
 perform public.finish_cakto_automation((a->>'token')::uuid,true,'{"processed":0}');
 update private.cakto_automation set next_discovery_at=clock_timestamp()-interval '1 second';
 a:=public.lease_cakto_automation();if a->>'offset'<>'1' then raise exception 'cursor not durable';end if;
 update private.cakto_automation set lease_until=clock_timestamp()-interval '1 second';b:=public.lease_cakto_automation();
 if a->>'token'=b->>'token' then raise exception 'expired lease not replaced';end if;
 denied:=false;begin perform public.finish_cakto_automation((a->>'token')::uuid,true,'{}',1,2,false);exception when raise_exception then denied:=sqlerrm='automation_lease_invalid';end;if not denied then raise exception 'expired worker finished';end if;
 perform public.finish_cakto_automation((b->>'token')::uuid,false,'{"failed":1}');
 if (public.cakto_automation_status()->>'offset')::int<>1 or (public.cakto_automation_status()->>'lastOk')::boolean then raise exception 'failure advanced cursor';end if;
 update private.cakto_automation set next_discovery_at=clock_timestamp()-interval '1 second';a:=public.lease_cakto_automation();
 perform public.finish_cakto_automation((a->>'token')::uuid,true,'{}',null,null,true);
 if exists(select 1 from private.cakto_automation where scan_since is not null or scan_page<>1 or scan_offset<>0 or next_discovery_at<clock_timestamp()+interval '14 minutes') then raise exception 'scan not reset';end if;
 if has_table_privilege('anon','private.cakto_automation','select') or has_table_privilege('service_role','private.cakto_automation','select,update') or
 has_function_privilege('authenticated','public.lease_cakto_automation()','execute') or has_function_privilege('service_role','private.dispatch_cakto_automation()','execute') or
 has_function_privilege('anon','public.consume_cakto_dispatch(text)','execute') then raise exception 'scheduler permissions';end if;
 update private.cakto_automation set dispatch_hash=encode(extensions.digest(repeat('a',64),'sha256'),'hex'),dispatch_expires_at=clock_timestamp()+interval '1 minute';
 if not public.consume_cakto_dispatch(repeat('a',64)) or public.consume_cakto_dispatch(repeat('a',64)) or public.consume_cakto_dispatch('invalid') then raise exception 'dispatch replay accepted';end if;
 update private.cakto_automation set dispatch_hash=encode(extensions.digest(repeat('a',64),'sha256'),'hex'),dispatch_expires_at=clock_timestamp()-interval '1 second';
 if public.consume_cakto_dispatch(repeat('a',64)) then raise exception 'expired dispatch accepted';end if;
 update private.cakto_automation set enabled=false;if public.lease_cakto_automation() is not null then raise exception 'paused worker ran';end if;
end$$;
select true as automation_lease_cursor_failure_permissions_passed;
rollback;
