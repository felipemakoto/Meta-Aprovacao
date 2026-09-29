import { NextRequest, NextResponse } from "next/server.js";
import { parseSignup } from "./signup-contract.ts";

export const authHeaders = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", "Referrer-Policy": "no-referrer" };
type Settings = { secure: boolean; origin?: string };
type AuthError = { code?: string; status?: number } | null;
type Dependencies = {
  signedIn: () => Promise<boolean>;
  signup: (input: { email: string; password: string; redirectTo: string }) => Promise<{ error: AuthError; confirmed: boolean }>;
  exchange: (code: string) => Promise<boolean | "recovery">;
};

export function trustedAuthOrigin(value: string | null, settings: Settings): string | null {
  try {
    if (settings.origin) {
      const configured = new URL(settings.origin);
      if (configured.username || configured.password || configured.pathname !== "/" || configured.search || configured.hash) return null;
      if (settings.secure && configured.protocol !== "https:") return null;
      return value === configured.origin ? configured.origin : null;
    }
    return !settings.secure && ["http://localhost:3000", "http://127.0.0.1:3000"].includes(value ?? "") ? value : null;
  } catch { return null; }
}

export function createSignupHandlers(deps: Dependencies, settings: Settings) {
  const json = (data: unknown, status: number) => NextResponse.json(data, { status, headers: authHeaders });
  async function POST(request: NextRequest) {
    const origin = trustedAuthOrigin(request.headers.get("origin"), settings);
    if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "invalid_origin" }, 403);
    if (request.nextUrl.search) return json({ error: "invalid_input" }, 400);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "invalid_input" }, 415);
    try {
      // Limit streamed input too; Content-Length alone can be absent or forged.
      const reader = request.body?.getReader();
      if (!reader) return json({ error: "invalid_input" }, 400);
      const chunks: Uint8Array[] = []; let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 2048) return json({ error: "invalid_input" }, 413);
          chunks.push(value);
        }
      } finally { await reader.cancel(); reader.releaseLock(); }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      let input;
      try { input = parseSignup(JSON.parse(new TextDecoder().decode(bytes))); } catch { return json({ error: "invalid_input" }, 400); }
      if (!input) return json({ error: "invalid_input" }, 400);
      if (await deps.signedIn()) return json({ error: "already_authenticated" }, 409);
      const { error, confirmed } = await deps.signup({ email: input.email, password: input.password, redirectTo: `${origin}/auth/confirm` });
      if (error) {
        // Do not expose provider messages or account existence.
        if (["user_already_exists", "email_exists"].includes(error.code ?? "")) return json({ status: "check_email" }, 202);
        if (error.status === 429 || ["over_email_send_rate_limit", "over_request_rate_limit"].includes(error.code ?? "")) return json({ error: "rate_limited" }, 429);
        if (error.code === "weak_password") return json({ error: "weak_password" }, 422);
        if (["email_address_invalid", "validation_failed"].includes(error.code ?? "")) return json({ error: "invalid_input" }, 400);
        return json({ error: "signup_unavailable" }, 503);
      }
      return json({ status: confirmed ? "confirmed" : "check_email" }, 202);
    } catch { return json({ error: "signup_unavailable" }, 503); }
  }

  async function GET(request: NextRequest) {
    // Never use next/redirect_to supplied by the browser as a redirect destination.
    // Next may normalize 127.0.0.1 to localhost internally. Keep the local
    // cookie host, accepting only the two explicit development addresses.
    const localOrigin = request.headers.get("host") ? `http://${request.headers.get("host")}` : request.nextUrl.origin;
    const origin = settings.origin ? trustedAuthOrigin(settings.origin, settings) : trustedAuthOrigin(localOrigin, settings);
    if (!origin) return json({ error: "auth_unavailable" }, 503);
    const params = request.nextUrl.searchParams;
    const codes = params.getAll("code");
    let ok: boolean | "recovery" = false;
    if (!params.has("error") && codes.length === 1 && /^[a-zA-Z0-9_-]{16,512}$/.test(codes[0])) {
      try { ok = await deps.exchange(codes[0]); } catch { /* Link expired, missing verifier or service unavailable. */ }
    }
    return NextResponse.redirect(new URL(ok === "recovery" ? "/nova-senha" : ok ? "/cadastro/confirmado" : "/cadastro/confirmacao-invalida", origin), { status: 303, headers: authHeaders });
  }
  return { POST, GET };
}
