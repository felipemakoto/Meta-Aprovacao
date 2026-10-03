begin;
do $$
declare u uuid:=gen_random_uuid(); s uuid:=gen_random_uuid(); t timestamptz:=clock_timestamp(); denied boolean;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t);
 insert into private.subscriptions(id,user_id,external_subscription_id,external_product_id,provider_status)
 values(s,u,'same-external-id','fixture-product','active');
 if (select provider from private.subscriptions where id=s)<>'cakto' then raise exception 'wrong default provider';end if;
 insert into private.subscriptions(user_id,provider,external_subscription_id,external_product_id,provider_status)
 values(u,'kiwify','same-external-id','fixture-product','active');
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'provider active granted access';end if;
 denied:=false;begin update private.subscriptions set provider='kiwify' where id=s;exception when raise_exception then denied:=sqlerrm='subscription_identity_immutable';end;
 if not denied then raise exception 'provider identity mutable';end if;
 denied:=false;begin insert into private.subscriptions(user_id,provider,external_subscription_id,external_product_id,provider_status) values(u,'other','id','p','active');exception when check_violation then denied:=true;end;
 if not denied then raise exception 'unsupported provider accepted';end if;
 insert into private.checkout_intents(user_id,provider,product_id,offer_id,checkout_url,first_price_cents,created_at,expires_at)
 values(u,'kiwify','p','historical','https://pay.kiwify.com.br/fixture',2000,t,t+interval '1 hour');
 denied:=false;begin insert into private.checkout_intents(user_id,provider,product_id,offer_id,checkout_url,first_price_cents,created_at,expires_at)
 values(u,'cakto','p','o','https://pay.kiwify.com.br/fixture',1000,t,t+interval '1 hour');exception when check_violation then denied:=true;end;
 if not denied then raise exception 'mixed provider and URL accepted';end if;
 if (select count(*) from private.checkout_intents where user_id=u and provider='kiwify')<>1 then raise exception 'historical provider lost';end if;
end;$$;
select true as cakto_provider_constraints_passed;
rollback;
