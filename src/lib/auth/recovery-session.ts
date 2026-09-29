import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedUser } from "./user";
import { isRecentRecovery } from "./recovery-contract";
export async function hasRecoverySession() {
  const user = await getVerifiedUser();
  if (!user) return false;
  const client = await createClient();
  const {data,error} = await client.auth.getClaims();
  if (error) throw new Error("Não foi possível verificar a recuperação.");
  return !!data && isRecentRecovery(data.claims,user.id);
}
