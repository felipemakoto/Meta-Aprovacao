import {createHmac, timingSafeEqual, randomBytes} from "node:crypto";
import {legalDocuments, signupAgreement} from "./legal-documents.ts";

export const googleCallbackPath = "/auth/google/callback";
export const googleAgreementPath = "/auth/google";
export const googleCookieName = (secure: boolean) => secure ? "__Secure-google-agreement" : "google-agreement";

export function parseGoogleStart(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  return Object.keys(input).length === 2 && input.acceptedLegal === true && input.legalVersion === legalDocuments.version;
}

function mac(payload: string, secret: string) {
  if (secret.length < 32) throw Error("oauth_configuration_unavailable");
  return createHmac("sha256", secret).update("meta-google-agreement-v1\n" + payload).digest("hex");
}
export function sealGoogleAgreement(origin: string, secret: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({origin, nonce: randomBytes(32).toString("hex"), agreement: signupAgreement(now)})).toString("base64url");
  return payload + "." + mac(payload, secret);
}
export function openGoogleAgreement(cookie: string | undefined, origin: string, secret: string, now = Date.now()) {
  if (!cookie || cookie.length > 2048) return null;
  const match = cookie.match(/^([A-Za-z0-9_-]+)\.([a-f0-9]{64})$/);
  if (!match) return null;
  try {
    if (!timingSafeEqual(Buffer.from(match[2], "hex"), Buffer.from(mac(match[1], secret), "hex"))) return null;
    const value = JSON.parse(Buffer.from(match[1], "base64url").toString("utf8"));
    const agreement = value.agreement;
    if (value.origin !== origin || !/^[a-f0-9]{64}$/.test(value.nonce) || agreement.version !== legalDocuments.version || agreement.terms_accepted !== true || agreement.privacy_acknowledged !== true) return null;
    const accepted = Date.parse(agreement.accepted_at);
    if (!Number.isFinite(accepted) || accepted > now || now - accepted > 10 * 60000) return null;
    return {version: legalDocuments.version, accepted_at: agreement.accepted_at as string, terms_accepted: true as const, privacy_acknowledged: true as const};
  } catch {return null;}
}

export function validGoogleAuthorizeUrl(value: string, supabaseOrigin: string, origin: string) {
  try {
    const url = new URL(value);
    return url.origin === supabaseOrigin && url.protocol === "https:" && !url.username && !url.password && !url.hash && url.pathname === "/auth/v1/authorize" &&
      url.searchParams.getAll("provider").length === 1 && url.searchParams.get("provider") === "google" &&
      url.searchParams.getAll("redirect_to").length === 1 && url.searchParams.get("redirect_to") === origin + googleCallbackPath &&
      url.searchParams.get("code_challenge_method") === "s256" && /^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get("code_challenge") ?? "");
  } catch {return false;}
}

// Claims and identity must come from provider-verified getClaims/getUser calls.
export function isVerifiedGoogleSession(user: {id: string; email_confirmed_at?: string | null; identities?: {provider: string}[]}, claims: Record<string, unknown>) {
  return !!user.email_confirmed_at && user.identities?.some(identity => identity.provider === "google") === true && claims.sub === user.id && claims.role === "authenticated" &&
    Array.isArray(claims.amr) && claims.amr.some(item => item && typeof item === "object" && item.method === "oauth") &&
    !claims.amr.some(item => item && typeof item === "object" && item.method === "recovery");
}
