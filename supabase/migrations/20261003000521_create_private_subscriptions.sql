-- Etapa 25: registros privados; não cria checkout nem ativa pagamentos.
create table private.subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null default 'kiwify' check (provider='kiwify'),
 external_subscription_id text not null check (external_subscription_id=btrim(external_subscription_id) and length(external_subscription_id) between 1 and 200),
 external_product_id text not null check (external_product_id=btrim(external_product_id) and length(external_product_id) between 1 and 200),
 external_plan_id text check (external_plan_id=btrim(external_plan_id) and length(external_plan_id) between 1 and 200),
 -- Valor observado, sem inventar um enum com estados não confirmados do provedor.
 provider_status text not null check (provider_status=btrim(provider_status) and length(provider_status) between 1 and 100),
 access_state text not null default 'unverified' check (access_state in ('unverified','granted','revoked')),
 access_from timestamptz,
 access_until timestamptz,
 last_verified_order_id text check (last_verified_order_id=btrim(last_verified_order_id) and length(last_verified_order_id) between 1 and 200),
 last_verified_at timestamptz,
 last_synced_at timestamptz,
 created_at timestamptz not null default clock_timestamp(),
 updated_at timestamptz not null default clock_timestamp(),
 constraint subscriptions_external_identity unique(provider,external_subscription_id),
 constraint subscriptions_finite_dates check (
  (access_from is null or isfinite(access_from)) and
  (access_until is null or isfinite(access_until)) and
  (last_verified_at is null or isfinite(last_verified_at)) and
  (last_synced_at is null or isfinite(last_synced_at)) and
  isfinite(created_at) and isfinite(updated_at)
 ),
 constraint subscriptions_access_period check (
  (access_from is null and access_until is null) or
  (access_from is not null and access_until is not null and access_until>access_from)
 ),
 constraint subscriptions_access_evidence check (
  (access_state='unverified' and access_from is null and access_until is null and last_verified_order_id is null and last_verified_at is null) or
  (access_state in ('granted','revoked') and access_from is not null and access_until is not null and
   last_verified_order_id is not null and last_verified_at is not null and last_synced_at is not null)
 )
);

-- Uma ordem atualmente registrada não pode conceder período a duas assinaturas.
-- A deduplicação histórica de todas as ordens/eventos pertence à etapa de pagamentos.
create unique index subscriptions_current_order_idx on private.subscriptions(provider,last_verified_order_id)
 where last_verified_order_id is not null;
create index subscriptions_user_access_idx on private.subscriptions(user_id,access_until) where access_state='granted';
alter table private.subscriptions enable row level security;
revoke all on private.subscriptions from public,anon,authenticated,service_role;

create function private.guard_subscription_identity() returns trigger
language plpgsql set search_path='' as $$
begin
 if new.id is distinct from old.id or new.user_id is distinct from old.user_id or
    new.provider is distinct from old.provider or new.external_subscription_id is distinct from old.external_subscription_id or
    new.external_product_id is distinct from old.external_product_id or new.created_at is distinct from old.created_at then
  raise exception 'subscription_identity_immutable';
 end if;
 new.updated_at:=clock_timestamp();
 return new;
end;$$;
revoke all on function private.guard_subscription_identity() from public,anon,authenticated,service_role;
create trigger subscriptions_identity_before_update before update on private.subscriptions
 for each row execute function private.guard_subscription_identity();

-- Só considera períodos verificados, vigentes e não revogados. A expiração é
-- calculada pelo relógio do banco; não depende de webhook nem de cron.
create function private.subscription_access(p_user_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare t timestamptz:=clock_timestamp(); until_at timestamptz;
begin
 if not exists(select 1 from auth.users where id=p_user_id and email_confirmed_at is not null) then
  raise exception 'login_required';
 end if;
 select max(access_until) into until_at from private.subscriptions
 where user_id=p_user_id and access_state='granted' and last_verified_at<=t and
       access_from<=t and access_until>t;
 return jsonb_build_object('hasPremium',until_at is not null,'accessUntil',until_at);
end;$$;
revoke all on function private.subscription_access(uuid) from public,anon,authenticated,service_role;

-- Apenas o servidor, depois de verificar a sessão, fornece o UUID da conta.
-- Não há RPC de escrita nem permissão direta de leitura/escrita por service_role.
create function public.read_subscription_access(p_user_id uuid) returns jsonb
language sql security definer set search_path='' as $$
 select private.subscription_access(p_user_id);
$$;
revoke all on function public.read_subscription_access(uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_subscription_access(uuid) to service_role;
