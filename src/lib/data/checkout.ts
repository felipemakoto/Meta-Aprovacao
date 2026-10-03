import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CheckoutOffer } from "@/lib/subscriptions/checkout-contract";

export async function createCheckoutIntent(user: string, offer: CheckoutOffer) {
  const { data, error } = await createAdminClient().rpc("create_checkout_intent", {
    p_user_id: user, p_product_id: offer.productId, p_plan_id: offer.planId,
    p_checkout_url: offer.url, p_first_price_cents: offer.firstPriceCents,
  });
  if (error) throw Error(error.message === "checkout_rate_limited" ? "checkout_rate_limited" : "checkout_unavailable");
  return data;
}
