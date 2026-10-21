-- Expand-only: existing quiz/practice RPCs stay available during application rollout.
create table private.guest_quiz_rate_buckets (
 bucket_key text not null,
 window_start timestamptz not null,
 used integer not null check (used > 0),
 expires_at timestamptz not null,
 primary key (bucket_key, window_start),
 check (bucket_key='global' or bucket_key ~ '^client:[a-f0-9]{64}$')
);
create index guest_quiz_rate_expiry_idx on private.guest_quiz_rate_buckets(expires_at);
alter table private.guest_quiz_rate_buckets enable row level security;
revoke all on private.guest_quiz_rate_buckets from public,anon,authenticated,service_role;

create function public.start_guest_quiz_limited(p_token_hash text,p_client_hash text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp(); minute_window timestamptz; client_window timestamptz; n integer;
begin
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' or p_client_hash is null or p_client_hash !~ '^[a-f0-9]{64}$' then
  raise exception 'invalid_token_hash' using errcode='22023';
 end if;
 -- A transport retry for the same token must not consume another rate slot.
 perform pg_advisory_xact_lock(hashtextextended(p_token_hash,0));
 if exists(select 1 from public.guest_quiz_attempts where token_hash=p_token_hash) then return public.read_guest_quiz(p_token_hash);end if;
 minute_window:=date_trunc('minute',t);
 client_window:=date_trunc('hour',t)+floor(extract(minute from t)/10)*interval '10 minutes';
 -- Same lock order for all callers: global bucket, then network bucket.
 insert into private.guest_quiz_rate_buckets values('global',minute_window,1,minute_window+interval '24 hours')
 on conflict(bucket_key,window_start) do update set used=private.guest_quiz_rate_buckets.used+1 returning used into n;
 if n>120 then raise exception 'rate_limited' using errcode='P0001';end if;
 insert into private.guest_quiz_rate_buckets values('client:'||p_client_hash,client_window,1,client_window+interval '24 hours')
 on conflict(bucket_key,window_start) do update set used=private.guest_quiz_rate_buckets.used+1 returning used into n;
 if n>20 then raise exception 'rate_limited' using errcode='P0001';end if;
 -- Bound cleanup work; only expired, newly introduced technical counters are removed.
 delete from private.guest_quiz_rate_buckets where (bucket_key,window_start) in
  (select bucket_key,window_start from private.guest_quiz_rate_buckets where expires_at<=t order by expires_at limit 100);
 return public.start_guest_quiz(p_token_hash);
end;$$;
revoke all on function public.start_guest_quiz_limited(text,text) from public,anon,authenticated,service_role;
grant execute on function public.start_guest_quiz_limited(text,text) to service_role;

create index practice_open_idx on private.practice_attempts(user_id,created_at desc) where completed_at is null;
create function public.read_open_question_practice(p_user_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then
  raise exception 'login_required' using errcode='P0001';
 end if;
 return (select jsonb_build_object('id',a.id,'questionId',a.question_id,'expiresAt',a.expires_at,
  'subject',a.snapshot->>'subject','topic',a.snapshot->>'topic','statement',a.snapshot->>'statement','options',a.snapshot->'options')
 from private.practice_attempts a where a.user_id=p_user_id and a.completed_at is null and a.expires_at>statement_timestamp()
 order by a.created_at desc,a.id desc limit 1);
end;$$;
revoke all on function public.read_open_question_practice(uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_open_question_practice(uuid) to service_role;
