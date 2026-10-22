-- Additive checkout ledger. Does not grant access or rewrite financial evidence.
create table private.direct_checkout_attempts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 reference text not null references private.checkout_intents(reference) on delete cascade,
 method text not null check(method in ('pix','pix_auto','credit_card')),
 state text not null check(state in ('processing','unknown','awaiting','paid','failed','complete')),
 payload text, payload_hash text not null check(payload_hash ~ '^[a-f0-9]{64}$'),
 lease uuid, lease_until timestamptz, checked_at timestamptz,
 order_id uuid unique, qr_code text check(octet_length(qr_code)<=4096), qr_expires_at timestamptz,
 created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp()
);
alter table private.direct_checkout_attempts enable row level security;
revoke all on private.direct_checkout_attempts from public,anon,authenticated,service_role;
create unique index direct_checkout_one_pending on private.direct_checkout_attempts(user_id) where state in ('processing','unknown','awaiting','paid');

create function public.read_direct_checkout(p_user_id uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r private.direct_checkout_attempts;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 perform pg_advisory_xact_lock(hashtextextended('checkout:'||p_user_id::text,0));
 update private.direct_checkout_attempts set state='unknown',lease=null,lease_until=null where user_id=p_user_id and state='processing' and lease_until<clock_timestamp();
 update private.direct_checkout_attempts set payload=null where user_id=p_user_id and created_at<clock_timestamp()-interval '24 hours' and payload is not null;
 if (private.subscription_access(p_user_id)->>'hasPremium')::boolean then
  update private.direct_checkout_attempts set state='complete',payload=null,qr_code=null,lease=null,lease_until=null,updated_at=clock_timestamp() where user_id=p_user_id and state in ('processing','unknown','awaiting','paid');
 end if;
 select * into r from private.direct_checkout_attempts where user_id=p_user_id and state in ('processing','unknown','awaiting','paid') order by created_at desc limit 1;
 if r.id is null then select * into r from private.direct_checkout_attempts where user_id=p_user_id and state='failed' and created_at>clock_timestamp()-interval '24 hours' order by created_at desc limit 1;end if;
 return case when r.id is null then null else to_jsonb(r)||jsonb_build_object('intent_expires_at',(select expires_at from private.checkout_intents where reference=r.reference)) end;
end$$;

create function public.begin_direct_checkout(p_user_id uuid,p_reference text,p_method text,p_payload text,p_hash text,p_lease uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r private.direct_checkout_attempts;i private.checkout_intents;
begin
 perform public.read_direct_checkout(p_user_id);
 if (private.subscription_access(p_user_id)->>'hasPremium')::boolean then raise exception 'already_premium';end if;
 select * into r from private.direct_checkout_attempts where user_id=p_user_id and state in ('processing','unknown','awaiting','paid') limit 1;
 if found then return jsonb_build_object('claimed',false,'attempt',to_jsonb(r));end if;
 select * into i from private.checkout_intents where reference=p_reference and user_id=p_user_id and provider='cakto' and expires_at>clock_timestamp() and first_price_cents=2299 and monthly_price_cents=2299;
 if not found or p_method not in ('pix','pix_auto','credit_card') or p_method is null or p_payload is null or octet_length(p_payload) not between 40 and 20000 or p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_lease is null then raise exception 'invalid_input';end if;
 if (select count(*) from private.direct_checkout_attempts where user_id=p_user_id and created_at>clock_timestamp()-interval '1 hour')>=4 then raise exception 'checkout_rate_limited';end if;
 insert into private.direct_checkout_attempts(user_id,reference,method,state,payload,payload_hash,lease,lease_until)
 values(p_user_id,p_reference,p_method,'processing',p_payload,p_hash,p_lease,clock_timestamp()+interval '60 seconds') returning * into r;
 return jsonb_build_object('claimed',true,'attempt',to_jsonb(r));
end$$;

create function public.resume_direct_checkout(p_user_id uuid,p_lease uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r private.direct_checkout_attempts;
begin
 perform public.read_direct_checkout(p_user_id);
 if (private.subscription_access(p_user_id)->>'hasPremium')::boolean then raise exception 'already_premium';end if;
 select * into r from private.direct_checkout_attempts where user_id=p_user_id and state in ('processing','unknown','awaiting','paid') limit 1;
 if r.id is null then raise exception 'payment_not_found';end if;
 if p_lease is null or r.state<>'unknown' or r.payload is null or r.created_at<clock_timestamp()-interval '23 hours' or not exists(select 1 from private.checkout_intents where reference=r.reference and expires_at>clock_timestamp()) then return jsonb_build_object('claimed',false,'attempt',to_jsonb(r));end if;
 update private.direct_checkout_attempts set state='processing',lease=p_lease,lease_until=clock_timestamp()+interval '60 seconds',updated_at=clock_timestamp() where id=r.id returning * into r;
 return jsonb_build_object('claimed',true,'attempt',to_jsonb(r));
end$$;

create function public.finish_direct_checkout(p_user_id uuid,p_id uuid,p_lease uuid,p_state text,p_order uuid default null,p_qr text default null,p_expires timestamptz default null) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_state is null or p_state not in ('unknown','awaiting','paid','failed') or octet_length(p_qr)>4096 or (p_state in ('awaiting','paid') and p_order is null) then raise exception 'invalid_input';end if;
 update private.direct_checkout_attempts set state=p_state,order_id=coalesce(p_order,order_id),qr_code=p_qr,qr_expires_at=p_expires,payload=case when p_state='unknown' then payload else null end,lease=null,lease_until=null,updated_at=clock_timestamp()
 where user_id=p_user_id and id=p_id and state='processing' and lease=p_lease;
 if not found then raise exception 'payment_state_changed';end if;
end$$;

create function public.refresh_direct_checkout(p_user_id uuid,p_id uuid,p_order uuid,p_state text) returns void language plpgsql security definer set search_path='' as $$
begin
 if p_state is null or p_state not in ('paid','failed') then raise exception 'invalid_input';end if;
 update private.direct_checkout_attempts set state=p_state,payload=null,qr_code=null,updated_at=clock_timestamp() where user_id=p_user_id and id=p_id and order_id=p_order and state in ('awaiting','paid');
end$$;

create function public.claim_direct_refresh(p_user_id uuid,p_id uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 update private.direct_checkout_attempts set checked_at=clock_timestamp() where user_id=p_user_id and id=p_id and order_id is not null and state in ('awaiting','paid') and (checked_at is null or checked_at<clock_timestamp()-interval '30 seconds');
 return found;
end$$;
revoke all on function public.claim_direct_refresh(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.claim_direct_refresh(uuid,uuid) to service_role;

revoke all on function public.read_direct_checkout(uuid),public.begin_direct_checkout(uuid,text,text,text,text,uuid),public.resume_direct_checkout(uuid,uuid),public.finish_direct_checkout(uuid,uuid,uuid,text,uuid,text,timestamptz),public.refresh_direct_checkout(uuid,uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.read_direct_checkout(uuid),public.begin_direct_checkout(uuid,text,text,text,text,uuid),public.resume_direct_checkout(uuid,uuid),public.finish_direct_checkout(uuid,uuid,uuid,text,uuid,text,timestamptz),public.refresh_direct_checkout(uuid,uuid,uuid,text) to service_role;

-- Retain the audit identifiers; erase encrypted retry material after its usable window.
select cron.schedule('meta-direct-checkout-retention','13 * * * *',$q$update private.direct_checkout_attempts set payload=null where payload is not null and created_at<clock_timestamp()-interval '24 hours'$q$)
where not exists(select 1 from cron.job where jobname='meta-direct-checkout-retention');
