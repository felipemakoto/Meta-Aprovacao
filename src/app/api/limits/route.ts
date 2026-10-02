import {getVerifiedUser} from "@/lib/auth/user";
import {createAdminClient} from "@/lib/supabase/admin";
import {limitsHandler} from "@/lib/quiz/limits-http";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const GET=limitsHandler({
 user:async()=>{const user=await getVerifiedUser();return user?.email_confirmed_at?user.id:null;},
 read:async user=>{const {data,error}=await createAdminClient().rpc("read_daily_limits",{p_user_id:user});if(error)throw new Error("limits_unavailable");return data;},
});
