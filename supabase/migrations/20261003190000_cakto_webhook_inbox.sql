-- Sinais autenticados aguardam consulta independente de pagamento; não concedem acesso.
create table private.cakto_event_inbox (
 id bigint generated always as identity primary key,
 fingerprint text not null unique check(fingerprint ~ '^[a-f0-9]{64}$'),
 event text not null,
 order_id text not null,
 product_id text not null,
 offer_id text not null,
 details jsonb not null,
 received_at timestamptz not null default clock_timestamp(),
 state text not null default 'pending' check(state='pending')
);
create index cakto_event_inbox_pending_idx on private.cakto_event_inbox(received_at,id);
alter table private.cakto_event_inbox enable row level security;
revoke all on private.cakto_event_inbox from public,anon,authenticated,service_role;
revoke all on sequence private.cakto_event_inbox_id_seq from public,anon,authenticated,service_role;

create function public.receive_cakto_events(p_events jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare r jsonb; k text;
begin
 if jsonb_typeof(p_events)<>'array' or p_events is null or jsonb_array_length(p_events) not between 1 and 25 then raise exception 'invalid_events';end if;
 for r in select value from jsonb_array_elements(p_events) loop
  if jsonb_typeof(r)<>'object' or octet_length(r::text)>4096 then raise exception 'invalid_event';end if;
  if not r ?& array['event','orderId','productId','offerId','status','subscriptionId','reference','paidAt','refundedAt','chargedbackAt','canceledAt'] then raise exception 'invalid_event';end if;
  for k in select jsonb_object_keys(r) loop
   if k<>all(array['event','orderId','productId','offerId','status','subscriptionId','reference','paidAt','refundedAt','chargedbackAt','canceledAt']) then raise exception 'private_or_unknown_field';end if;
  end loop;
  if r->>'event'<>all(array['purchase_approved','purchase_refused','refund','refund_requested','chargeback','subscription_created','subscription_canceled','subscription_renewed','subscription_renewal_refused','subscription_paused','subscription_resumed','subscription_late','subscription_late_recovered']) or jsonb_typeof(r->'event')<>'string' then raise exception 'invalid_event';end if;
  foreach k in array array['orderId','productId','offerId','status'] loop
   if jsonb_typeof(r->k)<>'string' or r->>k !~ '^[A-Za-z0-9_-]{1,200}$' then raise exception 'invalid_event';end if;
  end loop;
  if r->'subscriptionId'<>'null'::jsonb and (jsonb_typeof(r->'subscriptionId')<>'string' or r->>'subscriptionId' !~ '^[A-Za-z0-9_-]{1,200}$') then raise exception 'invalid_event';end if;
  if r->'reference'<>'null'::jsonb and (jsonb_typeof(r->'reference')<>'string' or r->>'reference' !~ '^[a-f0-9]{64}$') then raise exception 'invalid_event';end if;
  foreach k in array array['paidAt','refundedAt','chargedbackAt','canceledAt'] loop
   if r->k<>'null'::jsonb then
    if jsonb_typeof(r->k)<>'string' or length(r->>k)>64 or not isfinite((r->>k)::timestamptz) then raise exception 'invalid_event';end if;
   end if;
  end loop;
  insert into private.cakto_event_inbox(fingerprint,event,order_id,product_id,offer_id,details)
   values(encode(extensions.digest(convert_to(r::text,'UTF8'),'sha256'),'hex'),r->>'event',r->>'orderId',r->>'productId',r->>'offerId',r)
   on conflict(fingerprint) do nothing;
 end loop;
end;$$;
revoke all on function public.receive_cakto_events(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.receive_cakto_events(jsonb) to service_role;
