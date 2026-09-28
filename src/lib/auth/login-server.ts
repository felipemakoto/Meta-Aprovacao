import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedUser } from "./user";
import { createLoginHandlers } from "./login-http";
export const loginHandlers = createLoginHandlers({
  signedIn: async () => !!(await getVerifiedUser()),
  login: async input => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(input);
    return { error };
  },
  logout: async () => {
    const supabase = await createClient();
    return supabase.auth.signOut({ scope: "local" });
  },
}, { secure: process.env.NODE_ENV === "production", origin: process.env.APP_ORIGIN });
