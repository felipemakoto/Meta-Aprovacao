import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Verifica no servidor se o e-mail pertence a um administrador ativo.
 * Nunca expõe a lista de administradores ao cliente.
 */
export async function isEmailAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return false;

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("admin_users")
      .select("id")
      .eq("email", normalized)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) {
      return true;
    }
  } catch {
    // Fallback para variáveis de ambiente caso Supabase Admin não esteja configurado
  }

  const demoEmails = [
    process.env.DEMO_SUPER_ADMIN_EMAIL,
    process.env.DEMO_SUPORTE_EMAIL,
    process.env.DEMO_FINANCEIRO_EMAIL,
  ]
    .filter((v): v is string => Boolean(v))
    .map((v) => v.trim().toLowerCase());

  return demoEmails.includes(normalized);
}
