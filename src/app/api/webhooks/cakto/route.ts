import { webhookHandler } from "@/lib/subscriptions/webhook";
import { saveWebhookEvents } from "@/lib/data/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = webhookHandler({
  config: () => ({ secret: process.env.CAKTO_WEBHOOK_SECRET ?? "", product: process.env.CAKTO_PRODUCT_ID ?? "",
    offers: [...new Set([process.env.CAKTO_REGULAR_OFFER_ID ?? "", process.env.CAKTO_OCTOBER_OFFER_ID ?? ""])] }),
  now: () => Date.now(), save: saveWebhookEvents,
  diagnose: diagnostic => console.info("cakto_webhook_diagnostic", JSON.stringify(diagnostic)),
});
