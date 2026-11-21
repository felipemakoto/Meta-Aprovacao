import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { CheckoutOffer } from "@/lib/subscriptions/checkout-contract";

export async function createCheckoutIntent(user: string, offer: CheckoutOffer) {
  const { data, error } = await createAdminClient().rpc("create_guarded_checkout_intent", {
    p_user_id: user, p_product_id: offer.productId, p_offer_id: offer.offerId,
    p_checkout_url: offer.url, p_first_price_cents: offer.firstPriceCents,
  });
  if (error) throw Error(["checkout_rate_limited","payment_pending"].includes(error.message) ? error.message : "checkout_unavailable");
  return data;
}
