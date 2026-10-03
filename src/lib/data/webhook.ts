import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InboxEvent } from "@/lib/subscriptions/webhook";

export async function saveWebhookEvents(events: InboxEvent[]) {
  const { error } = await createAdminClient().rpc("receive_cakto_events", { p_events: events })
    .abortSignal(AbortSignal.timeout(3000));
  if (error) throw Error("webhook_storage_unavailable");
}
