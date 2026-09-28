import { NextRequest, NextResponse } from "next/server.js";
import { authHeaders, trustedAuthOrigin } from "./signup-http.ts";
import { parseLogin, type LoginInput } from "./login-contract.ts";
type AuthError = { code?: string; status?: number } | null;
type Dependencies = {
  signedIn: () => Promise<boolean>;
  login: (input: LoginInput) => Promise<{ error: AuthError }>;
  logout: () => Promise<{ error: AuthError }>;
};
export function createLoginHandlers(deps: Dependencies, settings: { secure: boolean; origin?: string }) {
  const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: authHeaders });
  async function handle(request: NextRequest, logout: boolean) {
    if (!trustedAuthOrigin(request.headers.get("origin"), settings) || request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "invalid_origin" }, 403);
    if (request.nextUrl.search) return json({ error: "invalid_input" }, 400);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({ error: "invalid_input" }, 415);
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({ error: "invalid_input" }, 400);
      const chunks: Uint8Array[] = []; let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 4096) return json({ error: "invalid_input" }, 413);
          chunks.push(value);
        }
      } finally { await reader.cancel(); reader.releaseLock(); }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      let body: unknown;
      try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { return json({ error: "invalid_input" }, 400); }
      if (logout) {
        if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).length) return json({ error: "invalid_input" }, 400);
        const { error } = await deps.logout();
        return error ? json({ error: "auth_unavailable" }, 503) : json({ status: "signed_out" });
      }
      const input = parseLogin(body);
      if (!input) return json({ error: "invalid_input" }, 400);
      if (await deps.signedIn()) return json({ status: "signed_in" });
      const { error } = await deps.login(input);
      if (error) {
        if (error.status === 429 || error.code === "over_request_rate_limit") return json({ error: "rate_limited" }, 429);
        if (["invalid_credentials", "email_not_confirmed", "user_banned"].includes(error.code ?? "")) return json({ error: "invalid_credentials" }, 401);
        return json({ error: "auth_unavailable" }, 503);
      }
      return json({ status: "signed_in" });
    } catch { return json({ error: "auth_unavailable" }, 503); }
  }
  return { login: (r: NextRequest) => handle(r, false), logout: (r: NextRequest) => handle(r, true) };
}
