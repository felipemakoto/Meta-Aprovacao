begin;
do $$
declare u uuid:=gen_random_uuid(); v uuid:=gen_random_uuid(); n uuid:=gen_random_uuid(); t timestamptz:=clock_timestamp();
 price integer; r jsonb; other_r jsonb; denied boolean; role_name text; i integer;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t),(v,t),(n,null);
 price:=case when t>=timestamptz '2026-10-01 00:00:00-03' and t<timestamptz '2026-11-01 00:00:00-03' then 1000 else 2000 end;
 set local role service_role;
 r:=public.create_checkout_intent(u,'fixture-product','fixture-plan','https://pay.kiwify.com.br/fixture',price);
 if r->>'reference' !~ '^[a-f0-9]{64}$' or (r->>'expiresAt')::timestamptz<=t then raise exception 'invalid reference or expiry';end if;
 if r<>public.create_checkout_intent(u,'fixture-product','fixture-plan','https://pay.kiwify.com.br/fixture',price) then raise exception 'retry not idempotent';end if;
 other_r:=public.create_checkout_intent(v,'fixture-product','fixture-plan','https://pay.kiwify.com.br/fixture',price);
 if r->>'reference'=other_r->>'reference' then raise exception 'reference reused by other account';end if;
 denied:=false;begin perform public.create_checkout_intent(n,'p','p','https://pay.kiwify.com.br/fixture',price);exception when raise_exception then denied:=sqlerrm='login_required';end;
 if not denied then raise exception 'unconfirmed user accepted';end if;
 denied:=false;begin perform public.create_checkout_intent(u,'p','p','https://evil.example/fixture',price);exception when raise_exception then denied:=sqlerrm='invalid_checkout_offer';end;
 if not denied then raise exception 'foreign checkout accepted';end if;
 denied:=false;begin perform public.create_checkout_intent(u,'p','p','https://pay.kiwify.com.br/fixture',case when price=1000 then 2000 else 1000 end);exception when raise_exception then denied:=sqlerrm='invalid_checkout_offer';end;
 if not denied then raise exception 'wrong campaign price accepted';end if;
 for i in 1..3 loop perform public.create_checkout_intent(u,'p','plan-'||i,'https://pay.kiwify.com.br/fixture',price);end loop;
 denied:=false;begin perform public.create_checkout_intent(u,'p','fifth','https://pay.kiwify.com.br/fixture',price);exception when raise_exception then denied:=sqlerrm='checkout_rate_limited';end;
 if not denied then raise exception 'rate limit missing';end if;
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'intent granted access';end if;
 reset role;
 denied:=false;begin update private.checkout_intents set plan_id='changed' where reference=r->>'reference';exception when raise_exception then denied:=sqlerrm='checkout_intent_immutable';end;
 if not denied then raise exception 'intent changed';end if;
 if not exists(select 1 from private.checkout_intents where reference=r->>'reference' and user_id=u) then raise exception 'wrong owner';end if;
 insert into private.subscriptions(user_id,external_subscription_id,external_product_id,provider_status,access_state,access_from,access_until,last_verified_order_id,last_verified_at,last_synced_at)
 values(v,gen_random_uuid()::text,'p','fixture','granted',t-interval '1 minute',t+interval '1 day',gen_random_uuid()::text,t,t);
 denied:=false;begin perform public.create_checkout_intent(v,'p','p','https://pay.kiwify.com.br/fixture',price);exception when raise_exception then denied:=sqlerrm='already_premium';end;
 if not denied then raise exception 'active account could buy again';end if;
 foreach role_name in array array['anon','authenticated','service_role'] loop
  if has_table_privilege(role_name,'private.checkout_intents','select,insert,update,delete') then raise exception 'direct table access: %',role_name;end if;
 end loop;
 foreach role_name in array array['anon','authenticated'] loop
  if has_function_privilege(role_name,'public.create_checkout_intent(uuid,text,text,text,integer)','execute') then raise exception 'client RPC access';end if;
 end loop;
 if not (select relrowsecurity from pg_class where oid='private.checkout_intents'::regclass) then raise exception 'RLS disabled';end if;
 delete from auth.users where id=u;
 if exists(select 1 from private.checkout_intents where user_id=u) then raise exception 'deleted owner retained';end if;
end;$$;
select true as checkout_intents_security_idempotency_limits_passed;
rollback;
