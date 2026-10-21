do $$
declare u uuid:=gen_random_uuid();other_u uuid:=gen_random_uuid();unconfirmed uuid:=gen_random_uuid();t timestamptz:=clock_timestamp();r jsonb;denied boolean;
begin
 insert into auth.users(id,email_confirmed_at) values(u,t),(other_u,t),(unconfirmed,null);
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'complimentary_free_before';end if;
 insert into private.complimentary_premium(user_id,access_from,access_until,reason) values(u,t-interval '1 minute',t+interval '30 days','Transactional test');
 r:=public.read_subscription_pricing(u);
 if not (r->>'hasPremium')::boolean or (r->>'hasPaidBefore')::boolean or (r->>'accessUntil')::timestamptz<>t+interval '30 days' then raise exception 'complimentary_access_or_financial_pollution';end if;
 perform public.premium_study_workspace(u,30);
 if (public.read_subscription_access(other_u)->>'hasPremium')::boolean then raise exception 'complimentary_owner_isolation';end if;
 update private.complimentary_premium set revoked_at=t where user_id=u;
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'complimentary_revoked';end if;
 update private.complimentary_premium set revoked_at=null,access_from=t-interval '2 days',access_until=t-interval '1 day' where user_id=u;
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'complimentary_expired';end if;
 update private.complimentary_premium set access_from=t+interval '1 day',access_until=t+interval '2 days' where user_id=u;
 if (public.read_subscription_access(u)->>'hasPremium')::boolean then raise exception 'complimentary_future';end if;
 insert into private.complimentary_premium(user_id,access_from,access_until,reason) values(unconfirmed,t,t+interval '1 day','Transactional test');
 denied:=false;begin perform public.read_subscription_access(unconfirmed);exception when raise_exception then denied:=sqlerrm='login_required';end;
 if not denied then raise exception 'complimentary_unconfirmed';end if;
 if has_table_privilege('anon','private.complimentary_premium','SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated','private.complimentary_premium','SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('service_role','private.complimentary_premium','SELECT,INSERT,UPDATE,DELETE') then raise exception 'complimentary_direct_access';end if;
 if not (select relrowsecurity from pg_class where oid='private.complimentary_premium'::regclass) then raise exception 'complimentary_rls';end if;
end$$;
select true as complimentary_premium_passed;
