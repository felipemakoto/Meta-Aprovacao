-- Additive rollout: old application remains compatible; no business data is rewritten.
create table private.security_request_budgets (
 bucket_key text primary key check(char_length(bucket_key) between 1 and 100),
 used int not null check(used>0), expires_at timestamptz not null
);
create index security_request_budget_expiry on private.security_request_budgets(expires_at);
create table private.document_verification_leases (
 user_id uuid primary key references auth.users(id) on delete cascade,
 lease uuid not null, expires_at timestamptz not null
);
alter table private.security_request_budgets enable row level security;
alter table private.document_verification_leases enable row level security;
revoke all on private.security_request_budgets,private.document_verification_leases from public,anon,authenticated,service_role;

create function public.reserve_login_attempt(p_network text,p_account text,p_pair text) returns boolean
language plpgsql security definer set search_path='' as $$
declare k text;cap int;t timestamptz:=clock_timestamp();
begin
 if p_network is null or p_account is null or p_pair is null or p_network !~ '^[a-f0-9]{64}$' or p_account !~ '^[a-f0-9]{64}$' or p_pair !~ '^[a-f0-9]{64}$' then raise exception 'invalid_input';end if;
 -- All instances acquire the same sorted locks; neither raw IP nor email is stored.
 for k in select v from unnest(array['login-network:'||p_network,'login-account:'||p_account,'login-pair:'||p_pair]) v order by v loop
  perform pg_advisory_xact_lock(hashtextextended(k,0));
 end loop;
 for k,cap in select * from (values('login-network:'||p_network,60),('login-account:'||p_account,20),('login-pair:'||p_pair,10)) limits(key,amount) loop
  if exists(select 1 from private.security_request_budgets where bucket_key=k and expires_at>t and used>=cap) then return false;end if;
 end loop;
 for k in select v from unnest(array['login-network:'||p_network,'login-account:'||p_account,'login-pair:'||p_pair]) v loop
  insert into private.security_request_budgets values(k,1,t+interval '5 minutes')
  on conflict(bucket_key) do update set used=case when private.security_request_budgets.expires_at<=t then 1 else private.security_request_budgets.used+1 end,
   expires_at=case when private.security_request_budgets.expires_at<=t then excluded.expires_at else private.security_request_budgets.expires_at end;
 end loop;
 delete from private.security_request_budgets where bucket_key in(select bucket_key from private.security_request_budgets where expires_at<=t order by expires_at limit 100);
 return true;
end$$;

create function public.reserve_document_verification(p_user_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp();token uuid:=gen_random_uuid();k text:='document:'||p_user_id::text;
begin
 perform private.require_study_premium(p_user_id);
 perform pg_advisory_xact_lock(hashtextextended('document-verification:'||p_user_id::text,0));
 if exists(select 1 from private.document_verification_leases where user_id=p_user_id and expires_at>t) then raise exception 'rate_limited';end if;
 if (select count(*) from private.study_documents where user_id=p_user_id)>=100 then raise exception 'activity_limit';end if;
 if exists(select 1 from private.security_request_budgets where bucket_key=k and expires_at>t and used>=5) then raise exception 'rate_limited';end if;
 insert into private.security_request_budgets values(k,1,t+interval '10 minutes')
 on conflict(bucket_key) do update set used=case when private.security_request_budgets.expires_at<=t then 1 else private.security_request_budgets.used+1 end,
  expires_at=case when private.security_request_budgets.expires_at<=t then excluded.expires_at else private.security_request_budgets.expires_at end;
 insert into private.document_verification_leases values(p_user_id,token,t+interval '90 seconds')
 on conflict(user_id) do update set lease=excluded.lease,expires_at=excluded.expires_at;
 return token;
end$$;

create function public.release_document_verification(p_user_id uuid,p_lease uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 delete from private.document_verification_leases where user_id=p_user_id and lease=p_lease;
end$$;

revoke all on function public.reserve_login_attempt(text,text,text),public.reserve_document_verification(uuid),public.release_document_verification(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.reserve_login_attempt(text,text,text),public.reserve_document_verification(uuid),public.release_document_verification(uuid,uuid) to service_role;

-- Serialize the final quota check as well, preserving existing document validation and ACL.
create or replace function public.premium_study_document(p_user_id uuid,p_document jsonb) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform private.require_study_premium(p_user_id);
 perform pg_advisory_xact_lock(hashtextextended('document-verification:'||p_user_id::text,0));
 if (select count(*) from private.study_documents where user_id=p_user_id)>=100 then raise exception 'activity_limit';end if;
 if jsonb_typeof(p_document)<>'object' or (select count(*) from jsonb_object_keys(p_document))<>6 or not p_document ?& array['institution','year','selection','examUrl','answerUrl','sourceUrl']
 or not exists(select 1 from private.study_institutions where id=p_document->>'institution') or (p_document->>'year')::int not between 2000 and 2100
 or char_length(p_document->>'selection') not between 1 and 120 then raise exception 'invalid_input';end if;
 -- Server verifies host, source links, content type and PDF magic before invoking this RPC.
 if p_document->>'examUrl' !~ '^https://(fatweb\.s3\.amazonaws\.com/vestibulinhoetec/|concurso30\.fundacaocefetminas\.org\.br/documentos/|([a-z0-9-]+\.)?ifsp\.edu\.br/|assets\.fatvestibulares\.com\.br/)' or
 p_document->>'answerUrl' !~ '^https://(fatweb\.s3\.amazonaws\.com/vestibulinhoetec/|concurso30\.fundacaocefetminas\.org\.br/documentos/|([a-z0-9-]+\.)?ifsp\.edu\.br/|assets\.fatvestibulares\.com\.br/)' then raise exception 'invalid_input';end if;
 insert into private.study_documents(user_id,institution,year,selection,exam_url,answer_url,source_url,verified_on)
 values(p_user_id,p_document->>'institution',(p_document->>'year')::int,p_document->>'selection',p_document->>'examUrl',p_document->>'answerUrl',p_document->>'sourceUrl',(statement_timestamp() at time zone 'America/Sao_Paulo')::date)
 on conflict(user_id,institution,exam_url) do nothing;
end$$;
