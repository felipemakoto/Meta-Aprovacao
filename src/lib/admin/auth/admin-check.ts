import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminRole } from "../rbac";
import type { AdminAccount } from "../types";

export async function readActiveAdmin(id: string): Promise<AdminAccount | null> {
  const { data, error } = await createAdminClient()
    .from("admin_users")
    .select("id, email, name, role, is_active, created_at")
    .eq("id", id)
    .eq("is_active", true)
    .abortSignal(AbortSignal.timeout(5000))
    .maybeSingle();

  if (error) throw new Error("Não foi possível verificar o acesso administrativo.");
  if (!data || !isAdminRole(data.role)) return null;

  return {
    id: data.id,
    email: data.email,
    nome: data.name,
    papel: data.role,
    ativo: data.is_active,
    criadoEm: data.created_at,
    ultimoAcessoEm: null,
  };
}
