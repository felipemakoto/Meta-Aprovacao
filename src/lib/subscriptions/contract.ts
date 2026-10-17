export type SubscriptionAccess = { hasPremium: boolean; accessUntil: string | null };
export function parseSubscriptionAccess(value: unknown): SubscriptionAccess {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("invalid_subscription_access");
  const r = value as Record<string, unknown>;
  if (typeof r.hasPremium !== "boolean" || (r.hasPremium
    ? typeof r.accessUntil !== "string" || !Number.isFinite(Date.parse(r.accessUntil))
    : r.accessUntil !== null)) throw Error("invalid_subscription_access");
  return { hasPremium: r.hasPremium, accessUntil: r.accessUntil as string | null };
}
export type SubscriptionPricing = SubscriptionAccess & { hasPaidBefore: boolean };
export function parseSubscriptionPricing(value: unknown): SubscriptionPricing {
  const access = parseSubscriptionAccess(value);
  const hasPaidBefore = (value as Record<string, unknown>).hasPaidBefore;
  if (typeof hasPaidBefore !== "boolean") throw Error("invalid_subscription_pricing");
  return { ...access, hasPaidBefore };
}
export type PremiumState = { kind: "login" } | { kind: "error" } | { kind: "ready"; access: SubscriptionPricing };
export async function loadPremium(deps: { user: () => Promise<string | null>; read: (id: string) => Promise<unknown> }): Promise<PremiumState> {
  try {
    const id = await deps.user();
    if (!id) return { kind: "login" };
    return { kind: "ready", access: parseSubscriptionPricing(await deps.read(id)) };
  } catch { return { kind: "error" }; }
}
// A campanha é restrita a outubro de 2026 no fuso comercial, não ao relógio do navegador.
export function premiumOffer(at: Date, hasPaidBefore = false) {
  if (!Number.isFinite(at.getTime()) || typeof hasPaidBefore !== "boolean") throw Error("invalid_offer_date");
  const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(at);
  const promotional = !hasPaidBefore && parts.find(p => p.type === "year")?.value === "2026" && parts.find(p => p.type === "month")?.value === "10";
  return { promotional, firstPrice: promotional ? 11.50 : 22.99, monthlyPrice: 22.99 };
}
