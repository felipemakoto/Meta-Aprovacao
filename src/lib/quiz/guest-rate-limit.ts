import { createHmac } from "node:crypto";
import { isIP } from "node:net";

// Only the deployment's trusted ingress header is eligible; browser headers and
// arbitrary X-Forwarded-For values are not identities outside Vercel.
export function guestClientHash(request: Request, secret: string, vercel: boolean) {
  if (secret.length < 32) throw Error("rate_limit_configuration_missing");
  const value = vercel ? request.headers.get("x-vercel-forwarded-for")?.trim() : undefined;
  const address = value && isIP(value) ? value.toLowerCase() : "unresolved";
  return createHmac("sha256", secret).update("meta-guest-limit-v1\n" + address).digest("hex");
}
