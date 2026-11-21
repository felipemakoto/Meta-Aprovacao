import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStore } from "../data/store";
import type { AdminAccount, AdminRole } from "../types";

interface VerifyAdminResult {
  ok: true;
  admin: AdminAccount;
}

interface VerifyAdminFailure {
  ok: false;
  reason: string;
}

/**
 * Autenticação real com Supabase Auth e verificação da tabela public.admin_users.
 * Também mantém suporte a credenciais de teste configuradas via variáveis de ambiente
 * caso Supabase não esteja configurado localmente.
 */
export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<VerifyAdminResult | VerifyAdminFailure> {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Tentar autenticar via Supabase Auth
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && anonKey) {
      const authClient = createClient(supabaseUrl, anonKey);
      const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (!authError && authData.user) {
        // Usuário autenticado com sucesso no Supabase Auth.
        // Agora verificamos se é um admin autorizado na tabela admin_users usando service_role
        const adminClient = createAdminClient();
        const { data: adminRecord, error: adminError } = await adminClient
          .from("admin_users")
          .select("id, email, name, role, is_active, created_at, updated_at")
          .eq("id", authData.user.id)
          .single();

        if (adminError || !adminRecord) {
          return {
            ok: false,
            reason: "Esta conta não possui permissão de acesso ao painel administrativo.",
          };
        }

        if (!adminRecord.is_active) {
          return {
            ok: false,
            reason: "Esta conta administrativa está desativada. Contate um Super Admin.",
          };
        }

        return {
          ok: true,
          admin: {
            id: adminRecord.id,
            nome: adminRecord.name,
            email: adminRecord.email,
            papel: adminRecord.role as AdminRole,
            ativo: adminRecord.is_active,
            criadoEm: adminRecord.created_at,
            ultimoAcessoEm: new Date().toISOString(),
          },
        };
      }
    }
  } catch {
    // Se a chamada ao Supabase falhar (por exemplo em ambiente isolado sem rede),
    // prossegue para conferência de credenciais demo/mock
  }

  // 2. Fallback de demonstração controlado por variáveis de ambiente
  const entries: { email: string; password: string; role: AdminRole; nome: string }[] = [];

  if (process.env.DEMO_SUPER_ADMIN_EMAIL && process.env.DEMO_SUPER_ADMIN_PASSWORD) {
    entries.push({
      email: process.env.DEMO_SUPER_ADMIN_EMAIL.toLowerCase(),
      password: process.env.DEMO_SUPER_ADMIN_PASSWORD,
      role: "super_admin",
      nome: "Super Admin",
    });
  }
  if (process.env.DEMO_SUPORTE_EMAIL && process.env.DEMO_SUPORTE_PASSWORD) {
    entries.push({
      email: process.env.DEMO_SUPORTE_EMAIL.toLowerCase(),
      password: process.env.DEMO_SUPORTE_PASSWORD,
      role: "suporte",
      nome: "Suporte",
    });
  }
  if (process.env.DEMO_FINANCEIRO_EMAIL && process.env.DEMO_FINANCEIRO_PASSWORD) {
    entries.push({
      email: process.env.DEMO_FINANCEIRO_EMAIL.toLowerCase(),
      password: process.env.DEMO_FINANCEIRO_PASSWORD,
      role: "financeiro",
      nome: "Financeiro",
    });
  }

  const matched = entries.find((e) => e.email === normalizedEmail && e.password === password);
  if (matched) {
    const store = getStore();
    const existing = store.admins.find((a) => a.email.toLowerCase() === normalizedEmail);
    return {
      ok: true,
      admin: {
        id: existing?.id ?? "demo-" + matched.role,
        nome: existing?.nome ?? matched.nome,
        email: matched.email,
        papel: matched.role,
        ativo: existing ? existing.ativo : true,
        criadoEm: existing?.criadoEm ?? new Date().toISOString(),
        ultimoAcessoEm: new Date().toISOString(),
      },
    };
  }

  return { ok: false, reason: "E-mail ou senha inválidos." };
}
