import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedUser } from "@/lib/auth/user";
import { createSignupHandlers } from "./signup-http";
import { isRecentRecovery } from "./recovery-contract";

export const signupHandlers = createSignupHandlers({
  signedIn: async () => !!(await getVerifiedUser()),
  signup: async ({ email, password, redirectTo }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } });
    return { error, confirmed: !!data.session && !!data.user?.email_confirmed_at };
  },
  exchange: async code => {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return false;
    const { data, error: userError } = await supabase.auth.getUser();
    if (userError || !data.user?.email_confirmed_at) return false;
    const claims = await supabase.auth.getClaims();
    if (claims.error) return false;
    if (claims.data && isRecentRecovery(claims.data.claims,data.user.id)) return "recovery";
    return true;
  },
}, { secure: process.env.NODE_ENV === "production", origin: process.env.APP_ORIGIN });
