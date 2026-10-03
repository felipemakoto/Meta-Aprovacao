import "server-only";
import { createAdminClient } from "../supabase/admin";
export async function readSubscriptionAccess(user: string) {
  const { data, error } = await createAdminClient().rpc("read_subscription_access", { p_user_id: user });
  if (error) throw Error("subscription_unavailable");
  return data;
}
