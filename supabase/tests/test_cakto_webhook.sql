begin;
do $$
declare r jsonb:=jsonb_build_object('event','purchase_approved','orderId','fixture-'||gen_random_uuid()::text,'productId','fixture-product','offerId','fixture-offer','status','paid','subscriptionId',null,'reference',null,'paidAt','2026-10-03T15:00:00Z','refundedAt',null,'chargedbackAt',null,'canceledAt',null);
 denied boolean; role_name text; before_count bigint;
begin
 select count(*) into before_count from private.cakto_event_inbox;
 set local role service_role;
 perform public.receive_cakto_events(jsonb_build_array(r));
 perform public.receive_cakto_events(jsonb_build_array(r));
 perform public.receive_cakto_events(jsonb_build_array(r||'{"event":"refund","status":"refunded","refundedAt":"2026-10-04T15:00:00Z"}'::jsonb));
 reset role;
 if (select count(*) from private.cakto_event_inbox)<>before_count+2 then raise exception 'duplicate or lifecycle event lost';end if;
 if exists(select 1 from private.cakto_event_inbox where order_id=r->>'orderId' and state<>'pending') then raise exception 'not pending';end if;
 -- Lote inteiro deve falhar se qualquer registro trouxer dado privado.
 denied:=false;begin
  perform public.receive_cakto_events(jsonb_build_array(r||'{"orderId":"new-in-atomic-batch"}'::jsonb,r||'{"customer":{"email":"private"}}'::jsonb));
 exception when raise_exception then denied:=sqlerrm='private_or_unknown_field';end;
 if not denied or exists(select 1 from private.cakto_event_inbox where order_id='new-in-atomic-batch') then raise exception 'partial batch or private field accepted';end if;
 denied:=false;begin perform public.receive_cakto_events(jsonb_build_array(r||'{"reference":"email@example.invalid"}'::jsonb));exception when raise_exception then denied:=true;end;
 if not denied then raise exception 'invalid reference accepted';end if;
 foreach role_name in array array['anon','authenticated','service_role'] loop
  if has_table_privilege(role_name,'private.cakto_event_inbox','select,insert,update,delete') then raise exception 'direct inbox access';end if;
 end loop;
 foreach role_name in array array['anon','authenticated'] loop
  if has_function_privilege(role_name,'public.receive_cakto_events(jsonb)','execute') then raise exception 'client RPC access';end if;
 end loop;
 if not (select relrowsecurity from pg_class where oid='private.cakto_event_inbox'::regclass) then raise exception 'RLS disabled';end if;
 if not has_function_privilege('service_role','public.receive_cakto_events(jsonb)','execute') then raise exception 'server RPC unavailable';end if;
end;$$;
select true as cakto_webhook_inbox_passed;
rollback;
