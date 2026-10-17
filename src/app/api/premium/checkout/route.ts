import { getVerifiedUser } from "@/lib/auth/user";
import { readSubscriptionPricing } from "@/lib/data/subscriptions";
import { createCheckoutIntent } from "@/lib/data/checkout";
import { configuredCheckout } from "@/lib/subscriptions/checkout-contract";
import { checkoutHandler } from "@/lib/subscriptions/checkout-http";
import { checkoutEnabled } from "@/lib/subscriptions/checkout-launch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Remover esta trava somente depois de validar oferta, vínculo, pagamentos e entrega.
// Configurar um link ou parâmetro do navegador não habilita cobranças.
export const POST = checkoutHandler({
  user: async () => { const u = await getVerifiedUser(); return u?.email_confirmed_at ? u.id : null; },
  access: readSubscriptionPricing,
  offer: (at, hasPaidBefore) => configuredCheckout(process.env, at, hasPaidBefore),
  create: createCheckoutIntent,
  now: () => new Date(),
}, { secure: process.env.NODE_ENV === "production", origin: process.env.APP_ORIGIN, enabled: checkoutEnabled });
