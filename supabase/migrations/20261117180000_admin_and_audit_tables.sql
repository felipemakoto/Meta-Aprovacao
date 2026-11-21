-- Migration: Criar tabelas e regras para o Painel Administrativo Interno
-- Tabelas: admin_users, audit_logs, admin_notes
-- Suporte a provider 'manual' em private.subscriptions
-- Índices para otimização de consultas administrativas

-- 1. Permitir provider 'manual' em private.subscriptions
alter table private.subscriptions drop constraint if exists subscriptions_provider_check;
alter table private.subscriptions add constraint subscriptions_provider_check check (provider in ('kiwify', 'cakto', 'manual'));

-- 2. Tabela de Administradores ligada ao auth.users
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null check (email = btrim(email) and length(email) between 3 and 255),
  name text not null check (name = btrim(name) and length(name) between 1 and 255),
  role text not null check (role in ('super_admin', 'suporte', 'financeiro')),
  is_active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists admin_users_role_idx on public.admin_users(role, is_active);
create index if not exists admin_users_email_idx on public.admin_users(email);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from public, anon;
grant select on public.admin_users to authenticated;
grant all on public.admin_users to service_role;

-- Política RLS: Usuário autenticado só lê admin_users se ele próprio for um admin ativo
create policy admin_users_select_policy on public.admin_users
  for select to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_active = true
    )
  );

-- 3. Tabela de Auditoria (Append-only)
create table if not exists public.audit_logs (
  id bigserial primary key,
  actor_id uuid not null references auth.users(id) on delete set null,
  actor_email text not null,
  actor_role text not null check (actor_role in ('super_admin', 'suporte', 'financeiro')),
  action text not null check (length(action) between 1 and 100),
  target_user_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_target_user_idx on public.audit_logs(target_user_id) where target_user_id is not null;
create index if not exists audit_logs_actor_idx on public.audit_logs(actor_id);

alter table public.audit_logs enable row level security;
-- Append-only: Proíbe UPDATE e DELETE para todos
revoke all on public.audit_logs from public, anon;
grant select on public.audit_logs to authenticated;
grant select, insert on public.audit_logs to service_role;

create policy audit_logs_select_policy on public.audit_logs
  for select to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_active = true
    )
  );

-- 4. Tabela de Notas Internas de Usuários
create table if not exists public.admin_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_email text not null,
  content text not null check (btrim(content) <> '' and length(content) <= 5000),
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists admin_notes_user_idx on public.admin_notes(user_id, created_at desc);

alter table public.admin_notes enable row level security;
revoke all on public.admin_notes from public, anon;
grant select, insert on public.admin_notes to authenticated;
grant all on public.admin_notes to service_role;

create policy admin_notes_select_policy on public.admin_notes
  for select to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_active = true
    )
  );

create policy admin_notes_insert_policy on public.admin_notes
  for insert to authenticated
  with check (
    author_id = auth.uid() and
    exists (
      select 1 from public.admin_users au
      where au.id = auth.uid() and au.is_active = true
    )
  );

-- 5. Função para conferir papel do admin com segurança
create or replace function public.get_admin_profile(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  r record;
begin
  select id, email, name, role, is_active into r
  from public.admin_users
  where id = p_user_id and is_active = true;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', r.id,
    'email', r.email,
    'name', r.name,
    'role', r.role,
    'isActive', r.is_active
  );
end;$$;

revoke all on function public.get_admin_profile(uuid) from public, anon;
grant execute on function public.get_admin_profile(uuid) to authenticated, service_role;
