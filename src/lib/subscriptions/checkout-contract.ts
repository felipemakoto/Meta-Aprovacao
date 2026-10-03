import { premiumOffer } from "./contract.ts";

export type CheckoutOffer = {
  url: string; productId: string; offerId: string;
  firstPriceCents: number; monthlyPriceCents: 2000;
};
type Environment = Record<string, string | undefined>;
export function checkoutUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.hostname !== "pay.cakto.com.br" || url.port ||
      url.username || url.password || url.hash || !/^\/[A-Za-z0-9]+$/.test(url.pathname)) throw Error("invalid_checkout_url");
  const keys = [...url.searchParams.keys()];
  // Nenhum dado pessoal, referência prévia ou redirecionamento entra na configuração.
  if (keys.some(k => k !== "coupon") || keys.length > 1 ||
      (keys.length && !/^[A-Za-z0-9_-]{1,25}$/.test(url.searchParams.get("coupon")!))) throw Error("invalid_checkout_url");
  return url;
}
export function configuredCheckout(env: Environment, at: Date): CheckoutOffer {
  const promotional = premiumOffer(at).promotional;
  const prefix = promotional ? "CAKTO_OCTOBER" : "CAKTO_REGULAR";
  const url = checkoutUrl(env[`${prefix}_CHECKOUT_URL`] ?? "").href;
  const productId = env.CAKTO_PRODUCT_ID ?? "";
  const offerId = env[`${prefix}_OFFER_ID`] ?? "";
  if (![productId, offerId].every(id => /^[A-Za-z0-9_-]{1,200}$/.test(id))) throw Error("checkout_not_configured");
  return { url, productId, offerId, firstPriceCents: promotional ? 1000 : 2000, monthlyPriceCents: 2000 };
}
export function checkoutDestination(value: unknown, offer: CheckoutOffer, at: Date): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("invalid_checkout_intent");
  const r = value as Record<string, unknown>;
  if (r.provider !== "cakto" || typeof r.reference !== "string" || !/^[a-f0-9]{64}$/.test(r.reference) ||
      typeof r.expiresAt !== "string" || !Number.isFinite(Date.parse(r.expiresAt)) ||
      Date.parse(r.expiresAt) <= at.getTime() || r.checkoutUrl !== offer.url ||
      r.productId !== offer.productId || r.offerId !== offer.offerId ||
      r.firstPriceCents !== offer.firstPriceCents || r.monthlyPriceCents !== 2000) throw Error("invalid_checkout_intent");
  const url = checkoutUrl(offer.url);
  url.searchParams.set("sck", r.reference);
  return url.href;
}
