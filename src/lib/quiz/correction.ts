import { NextRequest, NextResponse } from "next/server.js";

import { parseAnswers, toQuizResult, type Answers, type QuizResult } from "./result-contract.ts";
export { parseAnswers, toQuizResult } from "./result-contract.ts";
export type { Answers, QuizResult } from "./result-contract.ts";

type Dependencies = {
  submit: (token: string, answers: Answers) => Promise<QuizResult>;
  read: (token: string) => Promise<QuizResult | null>;
};
export function createCorrectionHandlers(deps: Dependencies, settings: { secure: boolean; origin?: string }) {
  const headers = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", Expires: "0" };
  const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers });
  const token = (r: NextRequest) => r.cookies.get(settings.secure ? "__Host-guest_quiz" : "guest_quiz")?.value;
  function originAllowed(r: NextRequest) {
    if (r.headers.get("sec-fetch-site") === "cross-site") return false;
    if (!settings.origin) return !settings.secure && ["http://localhost:3000", "http://127.0.0.1:3000"].includes(r.headers.get("origin") ?? "");
    try {
      const origin = new URL(settings.origin);
      return (!settings.secure || origin.protocol === "https:") && r.headers.get("origin") === origin.origin;
    } catch { return false; }
  }
  function failure(error: unknown) {
    const message = error instanceof Error ? error.message : "";
    const status = { attempt_unavailable: 401, attempt_already_submitted: 409, invalid_answers: 400 }[message];
    return json({ error: status ? message : "quiz_unavailable" }, status ?? 503);
  }
  async function GET(r: NextRequest) {
    if (r.headers.get("sec-fetch-site") === "cross-site") return json({ error: "invalid_origin" }, 403);
    if (r.nextUrl.search) return json({ error: "unexpected_input" }, 400);
    const value = token(r);
    if (!value || !/^[a-f0-9]{64}$/.test(value)) return json({ error: "attempt_unavailable" }, 401);
    try {
      const result = await deps.read(value);
      return result ? json(toQuizResult(result), 200) : json({ error: "attempt_unavailable" }, 401);
    } catch (error) { return failure(error); }
  }
  async function POST(r: NextRequest) {
    if (!originAllowed(r)) return json({ error: "invalid_origin" }, 403);
    if (r.nextUrl.search) return json({ error: "unexpected_input" }, 400);
    const value = token(r);
    if (!value || !/^[a-f0-9]{64}$/.test(value)) return json({ error: "attempt_unavailable" }, 401);
    if (r.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return json({ error: "unsupported_media_type" }, 415);
    if (Number(r.headers.get("content-length")) > 4096) return json({ error: "payload_too_large" }, 413);
    let answers: Answers;
    const reader = r.body?.getReader();
    if (!reader) return json({ error: "invalid_answers" }, 400);
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; void reader.cancel(); }, 10000);
    try {
      const chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 4096) return json({ error: "payload_too_large" }, 413);
        chunks.push(value);
      }
      if (timedOut) return json({ error: "request_timeout" }, 408);
      answers = parseAnswers(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    } catch { return json({ error: "invalid_answers" }, 400); }
    finally { clearTimeout(timer); await reader.cancel().catch(() => {}); reader.releaseLock(); }
    try { return json(toQuizResult(await deps.submit(value, answers)), 200); }
    catch (error) { return failure(error); }
  }
  return { GET, POST };
}
