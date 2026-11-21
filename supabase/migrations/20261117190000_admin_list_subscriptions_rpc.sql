-- Migration: Adicionar RPC segura para o painel admin listar assinaturas
-- Apenas service_role pode executar; não exposta a usuários comuns.

create or replace function public.admin_list_subscriptions()
returns table (
  id             uuid,
  user_id        uuid,
  provider       text,
  provider_status text,
  access_state   text,
  access_from    timestamptz,
  access_until   timestamptz,
  external_subscription_id text,
  created_at     timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select
    s.id,
    s.user_id,
    s.provider,
    s.provider_status,
    s.access_state,
    s.access_from,
    s.access_until,
    s.external_subscription_id,
    s.created_at
  from private.subscriptions s
  order by s.created_at desc;
$$;

-- Revoga todo acesso público e concede apenas ao service_role.
revoke all on function public.admin_list_subscriptions() from public, anon, authenticated;
grant execute on function public.admin_list_subscriptions() to service_role;
