-- Extensão pertence a supabase_admin; suas ACLs públicas não podem ser removidas por postgres.
-- Não enviar a chave permanente no transporte. Assinar nonce efêmero e consumi-lo uma única vez.
alter table private.cakto_automation add column dispatch_hash text,add column dispatch_expires_at timestamptz;
create function public.consume_cakto_dispatch(p_nonce text) returns boolean
language plpgsql security definer set search_path='' as $$
begin
 if p_nonce is null or p_nonce !~ '^[a-f0-9]{64}$' then return false;end if;
 update private.cakto_automation set dispatch_hash=null,dispatch_expires_at=null where id
 and dispatch_hash=encode(extensions.digest(p_nonce,'sha256'),'hex') and dispatch_expires_at>clock_timestamp();
 return found;
end;$$;
revoke all on function public.consume_cakto_dispatch(text) from public,anon,authenticated,service_role;
grant execute on function public.consume_cakto_dispatch(text) to service_role;

create or replace function private.dispatch_cakto_automation() returns bigint
language plpgsql security definer set search_path='' as $$
declare a private.cakto_automation;t timestamptz:=clock_timestamp();secret_value text;request_value bigint;nonce text;stamp text;mac text;
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
 nonce:=encode(extensions.gen_random_bytes(32),'hex');stamp:=floor(extract(epoch from t))::bigint::text;
 mac:=encode(extensions.hmac(convert_to(stamp||'.'||nonce||'.cakto-reconcile','UTF8'),convert_to(secret_value,'UTF8'),'sha256'),'hex');
 request_value:=net.http_post(url:=a.endpoint,body:='{}'::jsonb,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||nonce||'.'||mac,'X-Cakto-Worker-Timestamp',stamp),timeout_milliseconds:=120000);
 update private.cakto_automation set last_dispatched_at=t,dispatch_hash=encode(extensions.digest(nonce,'sha256'),'hex'),dispatch_expires_at=t+interval '90 seconds' where id;
 return request_value;
end;$$;
