import { NextRequest, NextResponse } from "next/server.js";
import { toQuizResult, type QuizResult } from "./result-contract.ts";

type Dependencies = {
  user: () => Promise<string | null>;
  claim: (token: string, userId: string) => Promise<void>;
  read: (userId: string) => Promise<QuizResult | null>;
};
export function createClaimHandlers(deps: Dependencies, settings: { secure: boolean; origin?: string }) {
  const json = (body: unknown, status: number) => NextResponse.json(body, { status,
    headers: { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache" } });
  function allowed(r: NextRequest) {
    if (r.headers.get("sec-fetch-site") === "cross-site") return false;
    try {
      if (settings.origin) {
        const url = new URL(settings.origin);
        return (!settings.secure || url.protocol === "https:") && r.headers.get("origin") === url.origin;
      }
      return !settings.secure && ["http://localhost:3000", "http://127.0.0.1:3000"].includes(r.headers.get("origin") ?? "");
    } catch { return false; }
  }
  async function POST(r: NextRequest) {
    if (!allowed(r)) return json({ error: "invalid_origin" }, 403);
    if (r.nextUrl.search) return json({ error: "unexpected_input" }, 400);
    // Sem payload: não há ID, nota ou destino escolhido pelo cliente.
    const reader = r.body?.getReader();
    if (reader) {
      let timeout = false;
      const timer = setTimeout(() => { timeout = true; void reader.cancel(); }, 5000);
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value.byteLength) return json({ error: "unexpected_input" }, 400);
        }
        if (timeout) return json({ error: "request_timeout" }, 408);
      } catch { return json({ error: "unexpected_input" }, 400); }
      finally { clearTimeout(timer); await reader.cancel().catch(() => {}); reader.releaseLock(); }
    }
    try {
      const userId = await deps.user();
      if (!userId) return json({ error: "login_required" }, 401);
      const token = r.cookies.get(settings.secure ? "__Host-guest_quiz" : "guest_quiz")?.value;
      if (!token || !/^[a-f0-9]{64}$/.test(token)) return json({ error: "attempt_unavailable" }, 404);
      await deps.claim(token, userId);
      return json({ status: "saved" }, 200);
    } catch (e) {
      return e instanceof Error && e.message === "attempt_unavailable"
        ? json({ error: "attempt_unavailable" }, 404) : json({ error: "quiz_unavailable" }, 503);
    }
  }
  async function GET(r: NextRequest) {
    if (r.headers.get("sec-fetch-site") === "cross-site") return json({ error: "invalid_origin" }, 403);
    if (r.nextUrl.search) return json({ error: "unexpected_input" }, 400);
    try {
      const userId = await deps.user();
      if (!userId) return json({ error: "login_required" }, 401);
      const result = await deps.read(userId);
      return result ? json(toQuizResult(result), 200) : json({ error: "result_not_found" }, 404);
    } catch { return json({ error: "quiz_unavailable" }, 503); }
  }
  return { GET, POST };
}
