-- Checkout real informado pelo usuário contém underscore; manter domínio e segmento restritos.
alter table private.checkout_intents drop constraint checkout_intents_checkout_url_check;
alter table private.checkout_intents add constraint checkout_intents_checkout_url_check check(
 (provider='kiwify' and checkout_url ~ '^https://pay\.kiwify\.com\.br/[A-Za-z0-9]+(\?coupon=[A-Za-z0-9_-]{1,25})?$') or
 (provider='cakto' and checkout_url ~ '^https://pay\.cakto\.com\.br/[A-Za-z0-9_-]+(\?coupon=[A-Za-z0-9_-]{1,25})?$')
);
create or replace function public.create_checkout_intent(p_user_id uuid,p_product_id text,p_offer_id text,p_checkout_url text,p_first_price_cents integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t timestamptz; r private.checkout_intents; expected_price integer; deadline timestamptz;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required'; end if;
 -- Serializa abas/repetições da mesma conta antes de conferir saldo e inserir.
 perform pg_advisory_xact_lock(hashtextextended('checkout:'||p_user_id::text,0));
 t:=clock_timestamp();
 if (private.subscription_access(p_user_id)->>'hasPremium')::boolean then raise exception 'already_premium'; end if;
 expected_price:=case when t>=timestamptz '2026-10-01 00:00:00-03' and t<timestamptz '2026-11-01 00:00:00-03' then 1000 else 2000 end;
 if p_first_price_cents is distinct from expected_price or p_product_id is null or p_offer_id is null or p_checkout_url is null or
    p_product_id !~ '^[A-Za-z0-9_-]{1,200}$' or p_offer_id !~ '^[A-Za-z0-9_-]{1,200}$' or
    p_checkout_url !~ '^https://pay\.cakto\.com\.br/[A-Za-z0-9_-]+(\?coupon=[A-Za-z0-9_-]{1,25})?$' then raise exception 'invalid_checkout_offer'; end if;
 select * into r from private.checkout_intents where provider='cakto' and user_id=p_user_id and product_id=p_product_id and offer_id=p_offer_id and
  checkout_url=p_checkout_url and first_price_cents=p_first_price_cents and created_at>t-interval '15 minutes' and expires_at>t
  order by created_at desc limit 1;
 if not found then
  if (select count(*) from private.checkout_intents where user_id=p_user_id and created_at>t-interval '1 hour')>=4 then raise exception 'checkout_rate_limited';end if;
  deadline:=t+interval '1 hour';
  if expected_price=1000 then deadline:=least(deadline,timestamptz '2026-11-01 00:00:00-03');end if;
  insert into private.checkout_intents(provider,user_id,product_id,offer_id,checkout_url,first_price_cents,expires_at)
   values('cakto',p_user_id,p_product_id,p_offer_id,p_checkout_url,p_first_price_cents,deadline) returning * into r;
 end if;
 return jsonb_build_object('provider',r.provider,'reference',r.reference,'expiresAt',r.expires_at,'checkoutUrl',r.checkout_url,
  'productId',r.product_id,'offerId',r.offer_id,'firstPriceCents',r.first_price_cents,'monthlyPriceCents',r.monthly_price_cents);
end;$$;
revoke all on function public.create_checkout_intent(uuid,text,text,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.create_checkout_intent(uuid,text,text,text,integer) to service_role;
