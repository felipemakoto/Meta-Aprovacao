begin;
do $$
declare token uuid;d jsonb;bad jsonb;denied boolean;before_page integer;before_offset integer;
begin
 update private.cakto_automation set enabled=true,product_id='diagnostic-fixture',offer_ids=array['offer'],lease_token=null,lease_until=null,lease_mode=null,next_discovery_at=clock_timestamp();
 token:=(public.lease_cakto_automation()->>'token')::uuid;
 select scan_page,scan_offset into before_page,before_offset from private.cakto_automation;
 d:='{"phase":"discovery","category":"provider_rate_limited","operation":"orders_list","status":429}';
 for bad in select value from jsonb_array_elements('[null,[],{},
  {"phase":"secret","category":"provider_unavailable"},
  {"phase":"discovery","category":"private-token"},
  {"phase":"discovery","category":"provider_unavailable","body":"private"},
  {"phase":"discovery","category":"provider_unavailable","operation":"private"},
  {"phase":"discovery","category":"provider_unavailable","operation":null},
  {"phase":"discovery","category":"provider_unavailable","status":"429"},
  {"phase":"discovery","category":"provider_unavailable","status":99},
  {"phase":"discovery","category":"provider_unavailable","status":600},
  {"phase":"discovery","category":"provider_unavailable","status":429.5}]'::jsonb) loop
  denied:=false;
  begin perform public.finish_cakto_automation(token,false,jsonb_build_object('failed',1,'diagnostic',bad));
  exception when raise_exception then denied:=sqlerrm='automation_summary_invalid';end;
  if not denied then raise exception 'diagnostic_guard_failed';end if;
 end loop;
 denied:=false;
 begin perform public.finish_cakto_automation(token,true,jsonb_build_object('diagnostic',d),null,null,true);
 exception when raise_exception then denied:=sqlerrm='automation_summary_invalid';end;
 if not denied then raise exception 'diagnostic_success_accepted';end if;
 perform public.finish_cakto_automation(token,false,jsonb_build_object('failed',1,'diagnostic',d));
 if exists(select 1 from private.cakto_automation where last_ok or last_summary<>jsonb_build_object('failed',1,'diagnostic',d) or scan_page<>before_page or scan_offset<>before_offset or lease_token is not null or next_discovery_at<clock_timestamp()+interval '4 minutes') then raise exception 'diagnostic_durability_failed';end if;
 if has_function_privilege('anon','public.finish_cakto_automation(uuid,boolean,jsonb,integer,integer,boolean)','execute') or has_function_privilege('authenticated','public.cakto_automation_status()','execute') then raise exception 'diagnostic_permissions_failed';end if;
end$$;
select true as automation_diagnostic_privacy_durability_passed;
rollback;
