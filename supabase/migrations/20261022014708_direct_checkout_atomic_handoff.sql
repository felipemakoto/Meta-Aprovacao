-- Serialize the hosted handoff and direct ledger on the same account lock.
create function public.create_guarded_checkout_intent(p_user_id uuid,p_product_id text,p_offer_id text,p_checkout_url text,p_first_price_cents integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pending jsonb;
begin
 pending:=public.read_direct_checkout(p_user_id);
 if pending->>'state' in ('processing','unknown','awaiting','paid') then raise exception 'payment_pending';end if;
 return public.create_checkout_intent(p_user_id,p_product_id,p_offer_id,p_checkout_url,p_first_price_cents);
end$$;
revoke all on function public.create_guarded_checkout_intent(uuid,text,text,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.create_guarded_checkout_intent(uuid,text,text,text,integer) to service_role;
