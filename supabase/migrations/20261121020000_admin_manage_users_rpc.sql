-- Migration: Funções administrativas para gerenciamento de usuários
-- Permite conceder, revogar e consultar status de usuários sem violar integridade de gateway

-- 1. Conceder ou estender Premium Manual
create or replace function public.admin_grant_manual_premium(
  p_user_id uuid,
  p_access_until timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_sub private.subscriptions%rowtype;
  new_until timestamptz := p_access_until;
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'user_not_found';
  end if;

  -- Se for vitalício, usamos uma data distante (ex: ano 2099) ou infinita
  if new_until is null then
    new_until := '2099-12-31 23:59:59+00'::timestamptz;
  end if;

  -- Verifica se já existe assinatura manual
  select * into existing_sub from private.subscriptions
  where user_id = p_user_id and provider = 'manual';

  if found then
    update private.subscriptions
    set access_state = 'granted',
        access_from = coalesce(access_from, clock_timestamp()),
        access_until = new_until,
        last_verified_at = clock_timestamp(),
        last_synced_at = clock_timestamp(),
        provider_status = 'active',
        updated_at = clock_timestamp()
    where id = existing_sub.id;
  else
    insert into private.subscriptions (
      user_id,
      provider,
      external_subscription_id,
      external_product_id,
      provider_status,
      access_state,
      access_from,
      access_until,
      last_verified_order_id,
      last_verified_at,
      last_synced_at
    ) values (
      p_user_id,
      'manual',
      'man_' || replace(gen_random_uuid()::text, '-', ''),
      'manual_grant',
      'active',
      'granted',
      clock_timestamp(),
      new_until,
      'ord_man_' || replace(gen_random_uuid()::text, '-', ''),
      clock_timestamp(),
      clock_timestamp()
    );
  end if;

  return jsonb_build_object('success', true, 'accessUntil', new_until);
end;
$$;

revoke all on function public.admin_grant_manual_premium(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.admin_grant_manual_premium(uuid, timestamptz) to service_role;


-- 2. Revogar Premium Manual
create or replace function public.admin_revoke_manual_premium(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.subscriptions
  set access_state = 'revoked',
      provider_status = 'canceled',
      last_synced_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where user_id = p_user_id and provider = 'manual';

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.admin_revoke_manual_premium(uuid) from public, anon, authenticated;
grant execute on function public.admin_revoke_manual_premium(uuid) to service_role;
