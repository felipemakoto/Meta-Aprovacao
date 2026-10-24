import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedUser } from "./user";
import { createLoginHandlers } from "./login-http";
import {createAdminClient} from "@/lib/supabase/admin";
import {loginRateKeys} from "./login-rate-limit";
export const loginHandlers = createLoginHandlers({
  signedIn: async () => !!(await getVerifiedUser()),
  allowLogin:async(request,input)=>{
    const keys=loginRateKeys(request,input.email,process.env.SUPABASE_SECRET_KEY??"",process.env.VERCEL==="1");
    const {data,error}=await createAdminClient().rpc("reserve_login_attempt",{p_network:keys.network,p_account:keys.account,p_pair:keys.pair}).abortSignal(AbortSignal.timeout(5000));
    if(error||typeof data!=="boolean")throw Error("auth_unavailable");return data;
  },
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
