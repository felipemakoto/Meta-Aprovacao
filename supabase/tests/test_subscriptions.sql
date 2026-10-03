-- Fixtures somente dentro desta transação; nunca representa pagamento real.
begin;
do $$
declare u uuid:=gen_random_uuid(); other_u uuid:=gen_random_uuid(); unconfirmed uuid:=gen_random_uuid();
 s uuid:=gen_random_uuid(); s2 uuid:=gen_random_uuid(); t timestamptz:=clock_timestamp();
 r jsonb; denied boolean; role_name text; command_name text;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t),(other_u,t),(unconfirmed,null);
 set local role service_role;
 r:=public.read_subscription_access(u);
 if r<>jsonb_build_object('hasPremium',false,'accessUntil',null) then raise exception 'default must deny';end if;
 denied:=false;begin perform public.read_subscription_access(unconfirmed);exception when raise_exception then denied:=sqlerrm='login_required';end;
 if not denied then raise exception 'unconfirmed user accepted';end if;
 denied:=false;begin perform public.read_subscription_access(null);exception when raise_exception then denied:=sqlerrm='login_required';end;
 if not denied then raise exception 'null user accepted';end if;
 denied:=false;begin perform public.read_subscription_access(gen_random_uuid());exception when raise_exception then denied:=sqlerrm='login_required';end;
 if not denied then raise exception 'unknown user accepted';end if;
 reset role;

 insert into private.subscriptions(id,user_id,external_subscription_id,external_product_id,provider_status)
 values(s,u,s::text,'fixture-product','active');
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'provider active granted access';end if;
 -- Nem uma data de sincronização é evidência de pagamento.
 update private.subscriptions set last_synced_at=t where id=s;
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'sync granted access';end if;
 denied:=false;begin update private.subscriptions set access_state='granted' where id=s;exception when check_violation then denied:=true;end;
 if not denied then raise exception 'grant without evidence';end if;
 denied:=false;begin update private.subscriptions set access_from=t,access_until=t+interval '1 day' where id=s;exception when check_violation then denied:=true;end;
 if not denied then raise exception 'unverified period accepted';end if;

 update private.subscriptions set access_state='granted',access_from=t-interval '1 day',access_until=t+interval '1 day',
  last_verified_order_id='fixture-order-'||s::text,last_verified_at=t,last_synced_at=t where id=s;
 set local role service_role;
 r:=public.read_subscription_access(u);
 if r->>'hasPremium'<>'true' or (r->>'accessUntil')::timestamptz<>t+interval '1 day' or (select count(*) from jsonb_object_keys(r))<>2 then raise exception 'verified access contract';end if;
 if public.read_subscription_access(other_u)->>'hasPremium'<>'false' then raise exception 'cross user access';end if;
 reset role;
 update private.subscriptions set provider_status='canceled' where id=s;
 if public.read_subscription_access(u)<>r then raise exception 'cancellation discarded paid period';end if;
 update private.subscriptions set access_state='revoked' where id=s;
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'revocation ignored';end if;
 update private.subscriptions set access_state='granted',access_from=t-interval '2 days',access_until=t-interval '1 day' where id=s;
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'expired access accepted';end if;
 update private.subscriptions set access_until=t where id=s;
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'end must be exclusive';end if;
 update private.subscriptions set access_from=t+interval '1 day',access_until=t+interval '2 days' where id=s;
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'future period accepted';end if;
 update private.subscriptions set access_from=t-interval '1 day',access_until=t+interval '1 day',last_verified_at=t+interval '1 day' where id=s;
 if public.read_subscription_access(u)->>'hasPremium'<>'false' then raise exception 'future verification accepted';end if;
 update private.subscriptions set last_verified_at=t where id=s;

 denied:=false;begin update private.subscriptions set access_until=access_from where id=s;exception when check_violation then denied:=true;end;
 if not denied then raise exception 'empty period accepted';end if;
 denied:=false;begin update private.subscriptions set access_until='infinity' where id=s;exception when check_violation then denied:=true;end;
 if not denied then raise exception 'infinite period accepted';end if;
 denied:=false;begin update private.subscriptions set external_plan_id=' ' where id=s;exception when check_violation then denied:=true;end;
 if not denied then raise exception 'blank plan accepted';end if;
 denied:=false;begin update private.subscriptions set provider_status='' where id=s;exception when check_violation then denied:=true;end;
 if not denied then raise exception 'blank provider status accepted';end if;
 denied:=false;begin update private.subscriptions set user_id=other_u where id=s;exception when raise_exception then denied:=sqlerrm='subscription_identity_immutable';end;
 if not denied then raise exception 'subscription transferred';end if;
 denied:=false;begin update private.subscriptions set external_subscription_id='changed' where id=s;exception when raise_exception then denied:=sqlerrm='subscription_identity_immutable';end;
 if not denied then raise exception 'external identity changed';end if;
 denied:=false;begin update private.subscriptions set external_product_id='changed' where id=s;exception when raise_exception then denied:=sqlerrm='subscription_identity_immutable';end;
 if not denied then raise exception 'product identity changed';end if;
 denied:=false;begin insert into private.subscriptions(user_id,external_subscription_id,external_product_id,provider_status)
  values(other_u,s::text,'fixture-product','active');exception when unique_violation then denied:=true;end;
 if not denied then raise exception 'duplicate subscription identity';end if;
 denied:=false;begin insert into private.subscriptions(user_id,external_subscription_id,external_product_id,provider_status,access_state,access_from,access_until,last_verified_order_id,last_verified_at,last_synced_at)
  values(other_u,s2::text,'fixture-product','active','granted',t,t+interval '3 days','fixture-order-'||s::text,t,t);exception when unique_violation then denied:=true;end;
 if not denied then raise exception 'current order reused';end if;

 insert into private.subscriptions(id,user_id,external_subscription_id,external_product_id,provider_status,access_state,access_from,access_until,last_verified_order_id,last_verified_at,last_synced_at)
 values(s2,u,s2::text,'fixture-product','active','granted',t,t+interval '3 days','fixture-order-'||s2::text,t,t);
 if (public.read_subscription_access(u)->>'accessUntil')::timestamptz<>t+interval '3 days' then raise exception 'multiple valid subscriptions';end if;
 update private.subscriptions set access_state='revoked' where id=s2;
 if (public.read_subscription_access(u)->>'accessUntil')::timestamptz<>t+interval '1 day' then raise exception 'revoked row hid valid access';end if;
 update private.subscriptions set updated_at=t-interval '10 days' where id=s;
 if (select updated_at<=t from private.subscriptions where id=s) then raise exception 'updated_at not maintained';end if;

 foreach role_name in array array['anon','authenticated','service_role'] loop
  foreach command_name in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'] loop
   if has_table_privilege(role_name,'private.subscriptions',command_name) then raise exception 'direct privilege: % %',role_name,command_name;end if;
  end loop;
  if has_function_privilege(role_name,'private.subscription_access(uuid)','EXECUTE') or
     has_function_privilege(role_name,'private.guard_subscription_identity()','EXECUTE') then raise exception 'private function privilege';end if;
 end loop;
 if not (select relrowsecurity from pg_class where oid='private.subscriptions'::regclass) then raise exception 'RLS disabled';end if;
 if exists(select 1 from pg_policy where polrelid='private.subscriptions'::regclass) then raise exception 'unexpected client policy';end if;
 if has_function_privilege('anon','public.read_subscription_access(uuid)','EXECUTE') or has_function_privilege('authenticated','public.read_subscription_access(uuid)','EXECUTE') or
    not has_function_privilege('service_role','public.read_subscription_access(uuid)','EXECUTE') then raise exception 'RPC grants';end if;
 -- Testa negação real, além da inspeção das permissões.
 set local role authenticated;
 denied:=false;begin perform public.read_subscription_access(u);exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'client called privileged RPC';end if;
 reset role;
 set local role service_role;
 denied:=false;begin perform 1 from private.subscriptions;exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'service_role direct read';end if;
 denied:=false;begin update private.subscriptions set access_state='revoked' where id=s;exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'service_role direct write';end if;
 reset role;
 delete from auth.users where id=u;
 if exists(select 1 from private.subscriptions where user_id=u) then raise exception 'deleted owner left subscriptions';end if;
 denied:=false;begin perform public.read_subscription_access(u);exception when raise_exception then denied:=sqlerrm='login_required';end;
 if not denied then raise exception 'deleted user accepted';end if;
end;$$;
rollback;
select true as subscriptions_access_ownership_constraints_privileges_passed;
