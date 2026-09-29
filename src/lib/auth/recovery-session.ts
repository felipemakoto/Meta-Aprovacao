import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedUser } from "./user";
import { isRecentRecovery } from "./recovery-contract";
export async function hasRecoverySession() {
  let serverTime: number | undefined;
  const client = await createClient(seconds => { serverTime = seconds; });
  const user = await getVerifiedUser(client);
  if (!user) return false;
  const {data,error} = await client.auth.getClaims();
  if (error) throw new Error("Não foi possível verificar a recuperação.");
  if (serverTime === undefined) throw new Error("Não foi possível verificar o horário da recuperação.");
  return !!data && isRecentRecovery(data.claims,user.id,serverTime);
}
