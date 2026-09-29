import { validateSignup } from "./signup-contract.ts";
export function parseRecoveryEmail(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== 1 || typeof input.email !== "string") return null;
  const email = input.email.trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
export function parseNewPassword(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== 2 || typeof input.password !== "string" || typeof input.confirmPassword !== "string") return null;
  const errors = validateSignup({email:"validation@example.test",password:input.password,confirmPassword:input.confirmPassword});
  return Object.keys(errors).length ? null : input.password;
}
// Apply only to claims returned by Supabase getClaims (signature verified), never decoded input.
export function isRecentRecovery(claims: Record<string, unknown>, userId: string, now: number): boolean {
  return claims.sub === userId && claims.role === "authenticated" && typeof claims.session_id === "string" &&
    typeof claims.exp === "number" && claims.exp > now && Array.isArray(claims.amr) &&
    claims.amr.some((item: unknown) => {
      if (!item || typeof item !== "object") return false;
      const amr = item as Record<string, unknown>;
      return amr.method === "recovery" && typeof amr.timestamp === "number" && amr.timestamp <= now && now - amr.timestamp < 900;
    });
}

export function classifyConfirmation(claims: Record<string, unknown>, userId: string, serverTime: number): boolean | "recovery" {
  const recovery = Array.isArray(claims.amr) && claims.amr.some(item => item && typeof item === "object" && item.method === "recovery");
  // An invalid recovery must never fall through to a successful signup screen.
  return recovery ? isRecentRecovery(claims,userId,serverTime) ? "recovery" : false : true;
}
