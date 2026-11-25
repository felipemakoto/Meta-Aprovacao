import type { AdminRole } from "./types";

export type PermissionAction =
  | "dashboard:view"
  | "users:view"
  | "users:export"
  | "users:edit_basic"
  | "users:grant_premium"
  | "users:revoke_premium"
  | "users:suspend"
  | "users:reset_password"
  | "users:delete"
  | "users:add_note"
  | "subscriptions:view"
  | "admins:view"
  | "admins:manage"
  | "audit:view"
  | "audit:export"
  | "settings:view"
  | "settings:manage_prices"
  | "settings:manage_flags"
  | "settings:manage_maintenance";

const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<PermissionAction>> = {
  super_admin: new Set<PermissionAction>([
    "dashboard:view",
    "users:view",
    "users:export",
    "users:edit_basic",
    "users:grant_premium",
    "users:revoke_premium",
    "users:suspend",
    "users:reset_password",
    "users:delete",
    "users:add_note",
    "subscriptions:view",
    "admins:view",
    "admins:manage",
    "audit:view",
    "audit:export",
    "settings:view",
    "settings:manage_prices",
    "settings:manage_flags",
    "settings:manage_maintenance",
  ]),
  suporte: new Set<PermissionAction>([
    "dashboard:view",
    "users:view",
    "users:export",
    "users:edit_basic",
    "users:grant_premium",
    "users:revoke_premium",
    "users:suspend",
    "users:reset_password",
    "users:add_note",
    "subscriptions:view",
    "audit:view",
  ]),
  financeiro: new Set<PermissionAction>([
    "dashboard:view",
    "subscriptions:view",
    "audit:view",
    "audit:export",
    "settings:view",
  ]),
};

/**
 * Função centralizada de controle de acesso baseado em papel (RBAC).
 * IMPORTANTE: Em produção com Supabase, estas mesmas regras devem ser aplicadas
 * tanto nas Route Handlers / Server Actions quanto em políticas RLS no Postgres.
 */
export function can(role: AdminRole | null | undefined, action: PermissionAction): boolean {
  return isAdminRole(role) && ROLE_PERMISSIONS[role].has(action);
}

export function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && Object.hasOwn(ROLE_PERMISSIONS, role);
}

export function assertCan(role: AdminRole | null | undefined, action: PermissionAction): void {
  if (!can(role, action)) {
    throw new Error(`Acesso negado: papel "${role ?? "desconhecido"}" não possui permissão para "${action}".`);
  }
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  suporte: "Suporte",
  financeiro: "Financeiro",
};
