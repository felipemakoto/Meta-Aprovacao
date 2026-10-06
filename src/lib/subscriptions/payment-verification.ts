import { record, orderUuid } from "./cakto-api.ts";

export type FirstPaymentExpectation = {
  orderId: string; productId: string; offerId: string; reference: string;
  createdAt: string; expiresAt: string; firstPriceCents: number; monthlyPriceCents: number; currency: "BRL";
};
// Expectation must come from a stored private checkout intent, never a browser/webhook.
export function firstPaymentDecision(orderValue: unknown, subscriptionValue: unknown, expected: FirstPaymentExpectation, now: number) {
  const reject = (reason: string) => ({verified:false as const, reason});
  try {
    const order = record(orderValue), sub = record(subscriptionValue);
    orderUuid(expected.orderId);
    if (typeof sub.id !== "string") return reject("incomplete_provider_response");
    orderUuid(sub.id);
    const created = instant(expected.createdAt), expires = instant(expected.expiresAt);
    if (![expected.productId,expected.offerId].every(v => typeof v === "string" && /^[A-Za-z0-9_-]{1,200}$/.test(v)) ||
      !/^[a-f0-9]{64}$/.test(expected.reference) || expected.currency !== "BRL" ||
      !Number.isFinite(now) || ![1150,2299].includes(expected.firstPriceCents) || expected.monthlyPriceCents !== 2299 ||
      created === null || expires === null || expires <= created || expires - created > 3600000) return reject("invalid_expectation");
    if (order.id !== expected.orderId || record(order.product).id !== expected.productId || sub.product !== expected.productId ||
      sub.offer !== expected.offerId || order.subscription !== sub.id || sub.parent_order !== expected.orderId ||
      !Array.isArray(sub.orders) || !sub.orders.includes(expected.orderId)) return reject("identity_mismatch");
    if (order.type !== "subscription" || order.offer_type !== "main" || order.subscription_period !== 1 || sub.recurrence_period !== 30 || sub.quantity_recurrences !== -1) return reject("not_first_subscription_payment");
    if (order.status !== "paid" || sub.status !== "active" || order.refundedAt !== null || order.chargedbackAt !== null ||
      order.canceledAt !== null || sub.canceledAt !== null) return reject("not_paid_or_reversed");
    if (order.sck !== expected.reference) return reject("reference_mismatch");
    const orderedAt = instant(order.createdAt), paidAt = instant(order.paidAt);
    if (orderedAt === null || paidAt === null || orderedAt < created || orderedAt > expires || paidAt < orderedAt || paidAt > now) return reject("invalid_payment_dates");
    // No implicit currency or guessed amount. Missing authoritative fields require review.
    if (order.currency !== "BRL") return reject("currency_unconfirmed");
    const base = cents(order.baseAmount), discount = cents(order.discount), total = cents(order.amount), monthly = cents(sub.amount);
    const expectedDiscount = expected.monthlyPriceCents - expected.firstPriceCents;
    if (base !== 2299 || discount !== expectedDiscount || total !== expected.firstPriceCents + 99 || monthly !== 2299 ||
      (expectedDiscount > 0 ? order.couponCode !== "primeiracompra" : order.couponCode !== null)) return reject("amount_or_coupon_mismatch");
    return {verified:true as const, reason:"payment_verified", evidence:{orderId:expected.orderId, subscriptionId:sub.id as string,
      productId:expected.productId, offerId:expected.offerId, paidAt:new Date(paidAt).toISOString(), paidPriceCents:expected.firstPriceCents, currency:"BRL" as const}};
  } catch { return reject("incomplete_provider_response"); }
}
function instant(value: unknown): number | null {
  return typeof value === "string" && value.length <= 64 && /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;
}
export function cents(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction=""] = value.split(".");
  return Number(whole)*100 + Number(fraction.padEnd(2,"0"));
}
