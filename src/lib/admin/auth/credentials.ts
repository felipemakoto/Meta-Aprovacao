import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { readActiveAdmin } from "./admin-check";
import type { AdminAccount } from "../types";

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<{ ok: true; admin: AdminAccount } | { ok: false }> {
  const { url, publishableKey } = getSupabaseConfig();
  const authClient = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await authClient.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error?.status && error.status >= 500) throw new Error("Autenticação indisponível.");
  if (error || !data.user?.email_confirmed_at) return { ok: false };

  const admin = await readActiveAdmin(data.user.id);
  return admin ? { ok: true, admin } : { ok: false };
}
