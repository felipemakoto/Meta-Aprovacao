import { NextRequest, NextResponse } from "next/server.js";
import { authHeaders, trustedAuthOrigin } from "./signup-http.ts";
import { parseRecoveryEmail, parseNewPassword } from "./recovery-contract.ts";
type AuthError = {code?: string; status?: number} | null;
type Dependencies = {
  request: (email: string, redirectTo: string) => Promise<{error: AuthError}>;
  authorized: () => Promise<boolean>;
  update: (password: string) => Promise<{error: AuthError}>;
  finish: () => Promise<void>;
};
export function createRecoveryHandlers(deps: Dependencies, settings: {secure: boolean; origin?: string}) {
  const json = (data: unknown, status = 200) => NextResponse.json(data,{status,headers:authHeaders});
  async function handle(request: NextRequest, update: boolean) {
    const origin = trustedAuthOrigin(request.headers.get("origin"),settings);
    if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return json({error:"invalid_origin"},403);
    if (request.nextUrl.search) return json({error:"invalid_input"},400);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({error:"invalid_input"},415);
    try {
      const reader = request.body?.getReader();
      if (!reader) return json({error:"invalid_input"},400);
      const chunks: Uint8Array[] = []; let size = 0;
      try {
        for (;;) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 2048) return json({error:"invalid_input"},413); chunks.push(value); }
      } finally { await reader.cancel(); reader.releaseLock(); }
      const bytes = new Uint8Array(size); let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
      let body: unknown;
      try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { return json({error:"invalid_input"},400); }
      const input = update ? parseNewPassword(body) : parseRecoveryEmail(body);
      if (!input) return json({error:"invalid_input"},400);
      if (update && !await deps.authorized()) return json({error:"recovery_required"},401);
      const {error} = update ? await deps.update(input) : await deps.request(input,`${origin}/auth/confirm`);
      if (error) {
        if (error.status === 429 || ["over_email_send_rate_limit","over_request_rate_limit"].includes(error.code ?? "")) return json({error:"rate_limited"},429);
        if (update && ["weak_password","same_password"].includes(error.code ?? "")) return json({error:error.code},422);
        if (update && ["session_not_found","bad_jwt","reauthentication_needed"].includes(error.code ?? "")) return json({error:"recovery_required"},401);
        return json({error:"recovery_unavailable"},503);
      }
      if (update) { await deps.finish(); return json({status:"password_updated"}); }
      return json({status:"check_email"},202);
    } catch { return json({error:"recovery_unavailable"},503); }
  }
  return {request: (r: NextRequest) => handle(r,false), update: (r: NextRequest) => handle(r,true)};
}
