import { checkoutDestination, type CheckoutOffer } from "./checkout-contract.ts";
import { parseSubscriptionAccess } from "./contract.ts";

type Settings = { secure: boolean; origin?: string; enabled: boolean };
type Dependencies = {
  user: () => Promise<string | null>;
  access: (user: string) => Promise<unknown>;
  offer: (at: Date) => CheckoutOffer;
  create: (user: string, offer: CheckoutOffer) => Promise<unknown>;
  now: () => Date;
};
export function checkoutHandler(deps: Dependencies, settings: Settings) {
  const json = (error: string, status: number) => Response.json({ error }, { status, headers: {
    "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff",
  } });
  return async function POST(request: Request) {
    let originAllowed = false;
    try {
      const configured = settings.origin ? new URL(settings.origin) : null;
      originAllowed = configured
        ? !configured.username && !configured.password && configured.pathname === "/" && !configured.search && !configured.hash &&
          (!settings.secure || configured.protocol === "https:") && request.headers.get("origin") === configured.origin
        : !settings.secure && ["http://localhost:3000", "http://127.0.0.1:3000"].includes(request.headers.get("origin") ?? "");
    } catch { /* Origem inválida nega a operação. */ }
    if (!originAllowed || request.headers.get("sec-fetch-site") === "cross-site") return json("invalid_origin", 403);
    // POST sem payload: URL, preço e proprietário nunca vêm do cliente.
    if (new URL(request.url).search || request.headers.get("content-type")) return json("invalid_input", 400);
    if (request.body) {
      // Next pode representar POST vazio como stream; aceitar somente EOF sem bytes.
      const reader = request.body.getReader();
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; void reader.cancel(); }, 3000);
      try {
        const chunk = await reader.read();
        if (timedOut || !chunk.done) return json("invalid_input", 400);
      } catch { return json("invalid_input", 400); }
      finally { clearTimeout(timer); await reader.cancel().catch(() => {}); reader.releaseLock(); }
    }
    try {
      const user = await deps.user();
      if (!user) return json("login_required", 401);
      if (!settings.enabled) return json("checkout_unavailable", 503);
      if (parseSubscriptionAccess(await deps.access(user)).hasPremium) return json("already_premium", 409);
      const offer = deps.offer(deps.now());
      const intent = await deps.create(user, offer);
      const location = checkoutDestination(intent, offer, deps.now());
      return new Response(null, { status: 303, headers: { Location: location,
        "Cache-Control": "private, no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
    } catch (e) {
      return e instanceof Error && e.message === "checkout_rate_limited"
        ? json("rate_limited", 429) : json("checkout_unavailable", 503);
    }
  };
}
