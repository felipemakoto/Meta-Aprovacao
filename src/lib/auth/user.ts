import "server-only";

import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function getVerifiedUser(client?: Awaited<ReturnType<typeof createClient>>) {
  const supabase = client ?? await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (
      isAuthSessionMissingError(error) ||
      ["bad_jwt", "session_not_found", "user_not_found", "refresh_token_not_found", "refresh_token_already_used"].includes(error.code ?? "")
    ) {
      return null;
    }
    // Falha operacional não deve ser confundida com usuário autenticado.
    throw new Error("Não foi possível verificar a autenticação.");
  }

  return data.user;
}
