-- Administrative testing access is independent of payment evidence and renewals.
-- No public write RPC; only database administration may issue/revoke a grant.
create table private.complimentary_premium (
 user_id uuid primary key references auth.users(id) on delete cascade,
 access_from timestamptz not null default clock_timestamp(),
 access_until timestamptz not null,
 reason text not null check(char_length(reason) between 1 and 200),
 revoked_at timestamptz,
 constraint complimentary_premium_finite check(isfinite(access_from) and isfinite(access_until) and (revoked_at is null or isfinite(revoked_at))),
 constraint complimentary_premium_period check(access_until>access_from and access_until<=access_from+interval '31 days')
);
alter table private.complimentary_premium enable row level security;
revoke all on private.complimentary_premium from public,anon,authenticated,service_role;
comment on table private.complimentary_premium is 'Expiring administrative test access; never represents a payment, purchase or recurring subscription.';

create or replace function private.subscription_access(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp();until_at timestamptz;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then raise exception 'login_required';end if;
 select max(case when s.access_policy='legacy' then s.access_until else
  (with recursive covered(until_at) as (
   select p.access_until from private.cakto_access_periods p where p.subscription_id=s.id and p.revoked_at is null and p.access_from<=t and p.access_until>t
   union
   select p.access_until from covered c join private.cakto_access_periods p on p.subscription_id=s.id and p.revoked_at is null and p.access_from<=c.until_at and p.access_until>c.until_at
  ) select max(covered.until_at) from covered) end)
 into until_at from private.subscriptions s where s.user_id=p_user_id and s.access_state='granted' and s.last_verified_at<=t and s.access_from<=t and s.access_until>t;
 select greatest(until_at,(select max(g.access_until) from private.complimentary_premium g where g.user_id=p_user_id and g.revoked_at is null and g.access_from<=t and g.access_until>t)) into until_at;
 return jsonb_build_object('hasPremium',until_at is not null,'accessUntil',until_at);
end;$$;
revoke all on function private.subscription_access(uuid) from public,anon,authenticated,service_role;
