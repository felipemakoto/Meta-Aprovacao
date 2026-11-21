// Local integration point: no cookies, identifiers or third-party requests.
export const checkoutVariant = "clarity-v1";
type EventName = "checkout_view" | "checkout_start" | "checkout_redirect" | "checkout_error" | "checkout_faq" | "checkout_preview";
export function trackCheckout(name: EventName, detail: {placement?: "summary" | "mobile"; reason?: string; item?: string} = {}) {
  try {
    window.dispatchEvent(new CustomEvent("meta:checkout", {detail: {name, variant: checkoutVariant, ...detail}}));
  } catch { /* Measurement must never interrupt a payment. */ }
}
