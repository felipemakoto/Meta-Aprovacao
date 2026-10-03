-- Referência de rastreamento não é credencial nem comprovação de pagamento.
create table private.checkout_intents (
 reference text primary key default encode(extensions.gen_random_bytes(32),'hex') check(reference ~ '^[a-f0-9]{64}$'),
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id text not null check(product_id ~ '^[A-Za-z0-9_-]{1,200}$'),
 plan_id text not null check(plan_id ~ '^[A-Za-z0-9_-]{1,200}$'),
 checkout_url text not null check(checkout_url ~ '^https://pay\.kiwify\.com\.br/[A-Za-z0-9]+(\?coupon=[A-Za-z0-9_-]{1,25})?$'),
 first_price_cents integer not null check(first_price_cents in(1000,2000)),
 monthly_price_cents integer not null default 2000 check(monthly_price_cents=2000),
 currency text not null default 'BRL' check(currency='BRL'),
 created_at timestamptz not null default clock_timestamp(),
 expires_at timestamptz not null,
 check(isfinite(created_at) and isfinite(expires_at) and expires_at>created_at and expires_at<=created_at+interval '1 hour')
);
create index checkout_intents_user_created_idx on private.checkout_intents(user_id,created_at desc);
alter table private.checkout_intents enable row level security;
revoke all on private.checkout_intents from public,anon,authenticated,service_role;

create function private.guard_checkout_intent() returns trigger
language plpgsql set search_path='' as $$
begin raise exception 'checkout_intent_immutable'; end;$$;
revoke all on function private.guard_checkout_intent() from public,anon,authenticated,service_role;
create trigger checkout_intent_no_update before update on private.checkout_intents
 for each row execute function private.guard_checkout_intent();

create function public.create_checkout_intent(p_user_id uuid,p_product_id text,p_plan_id text,p_checkout_url text,p_first_price_cents integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t timestamptz; r private.checkout_intents; expected_price integer; deadline timestamptz;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required'; end if;
 -- Serializa abas/repetições da mesma conta antes de conferir saldo e inserir.
 perform pg_advisory_xact_lock(hashtextextended('checkout:'||p_user_id::text,0));
 t:=clock_timestamp();
 if (private.subscription_access(p_user_id)->>'hasPremium')::boolean then raise exception 'already_premium'; end if;
 expected_price:=case when t>=timestamptz '2026-10-01 00:00:00-03' and t<timestamptz '2026-11-01 00:00:00-03' then 1000 else 2000 end;
 if p_first_price_cents is distinct from expected_price or p_product_id is null or p_plan_id is null or p_checkout_url is null or
    p_product_id !~ '^[A-Za-z0-9_-]{1,200}$' or p_plan_id !~ '^[A-Za-z0-9_-]{1,200}$' or
    p_checkout_url !~ '^https://pay\.kiwify\.com\.br/[A-Za-z0-9]+(\?coupon=[A-Za-z0-9_-]{1,25})?$' then raise exception 'invalid_checkout_offer'; end if;
 select * into r from private.checkout_intents where user_id=p_user_id and product_id=p_product_id and plan_id=p_plan_id and
  checkout_url=p_checkout_url and first_price_cents=p_first_price_cents and created_at>t-interval '15 minutes' and expires_at>t
  order by created_at desc limit 1;
 if not found then
  if (select count(*) from private.checkout_intents where user_id=p_user_id and created_at>t-interval '1 hour')>=4 then raise exception 'checkout_rate_limited';end if;
  deadline:=t+interval '1 hour';
  if expected_price=1000 then deadline:=least(deadline,timestamptz '2026-11-01 00:00:00-03');end if;
  insert into private.checkout_intents(user_id,product_id,plan_id,checkout_url,first_price_cents,expires_at)
   values(p_user_id,p_product_id,p_plan_id,p_checkout_url,p_first_price_cents,deadline) returning * into r;
 end if;
 return jsonb_build_object('reference',r.reference,'expiresAt',r.expires_at,'checkoutUrl',r.checkout_url,
  'productId',r.product_id,'planId',r.plan_id,'firstPriceCents',r.first_price_cents,'monthlyPriceCents',r.monthly_price_cents);
end;$$;
revoke all on function public.create_checkout_intent(uuid,text,text,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.create_checkout_intent(uuid,text,text,text,integer) to service_role;
