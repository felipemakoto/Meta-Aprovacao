import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { hasRecoverySession } from "./recovery-session";
import { createRecoveryHandlers } from "./recovery-http";
export const recoveryHandlers = createRecoveryHandlers({
  request: async (email,redirectTo) => (await createClient()).auth.resetPasswordForEmail(email,{redirectTo}),
  authorized: hasRecoverySession,
  update: async password => {
    const {error} = await (await createClient()).auth.updateUser({password});
    return {error};
  },
  finish: async () => {
    // Password already changed: clear local cookies even if remote signout is unavailable.
    try { await (await createClient()).auth.signOut({scope:"local"}); } catch { /* Local cleanup below. */ }
    const store = await cookies();
    const prefix = `sb-${new URL(getSupabaseConfig().url).hostname.split(".")[0]}-auth-token`;
    store.getAll().filter(cookie => cookie.name === prefix || cookie.name.startsWith(prefix + ".") || cookie.name.startsWith(prefix + "-code-verifier")).forEach(cookie => store.delete(cookie.name));
  },
},{secure:process.env.NODE_ENV === "production",origin:process.env.APP_ORIGIN});
