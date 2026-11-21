import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

// Uso restrito às operações privilegiadas da DAL; nunca recebe cookies de usuário.
export function createAdminClient() {
  const { url } = getSupabaseConfig();
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error(
      "Configure SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor."
    );
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
