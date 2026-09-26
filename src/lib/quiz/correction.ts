import { NextRequest, NextResponse } from "next/server.js";

export type Answers = { questionId: string; answer: string }[];
export type QuizResult = {
  id: string; completedAt: string; total: number; score: number;
  questions: { id: string; position: number; subject: string; topic: string; statement: string;
    options: string[]; answer: string; correctAnswer: string; correct: boolean; explanation: string }[];
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const letter = /^[A-E]$/;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid_data");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("invalid_data");
  return value;
}
export function parseAnswers(value: unknown): Answers {
  const body = object(value);
  if (Object.keys(body).length !== 1 || !Array.isArray(body.answers) || body.answers.length !== 10) throw new Error("invalid_answers");
  const answers = body.answers.map((value) => {
    const a = object(value);
    if (Object.keys(a).length !== 2 || typeof a.questionId !== "string" || !uuid.test(a.questionId) ||
        typeof a.answer !== "string" || !letter.test(a.answer)) throw new Error("invalid_answers");
    return { questionId: a.questionId, answer: a.answer };
  });
  if (new Set(answers.map((a) => a.questionId)).size !== 10) throw new Error("invalid_answers");
  return answers;
}

// Allowlist de feedback: somente usado depois de a RPC confirmar a finalização.
export function toQuizResult(value: unknown): QuizResult {
  const r = object(value);
  if (r.total !== 10 || !Number.isInteger(r.score) || Number(r.score) < 0 || Number(r.score) > 10 ||
      !Array.isArray(r.questions) || r.questions.length !== 10) throw new Error("invalid_result");
  const completedAt = text(r.completedAt);
  if (!Number.isFinite(Date.parse(completedAt))) throw new Error("invalid_result");
  const questions = r.questions.map((value, index) => {
    const q = object(value);
    if (q.position !== index + 1 || !Array.isArray(q.options) || q.options.length !== 5 ||
        typeof q.correct !== "boolean" || !letter.test(text(q.answer)) || !letter.test(text(q.correctAnswer)) ||
        q.correct !== (q.answer === q.correctAnswer)) throw new Error("invalid_result");
    return { id: text(q.id), position: index + 1, subject: text(q.subject), topic: text(q.topic),
      statement: text(q.statement), options: q.options.map(text), answer: text(q.answer),
      correctAnswer: text(q.correctAnswer), correct: q.correct, explanation: text(q.explanation) };
  });
  if (questions.filter((q) => q.correct).length !== r.score || new Set(questions.map((q) => q.id)).size !== 10) throw new Error("invalid_result");
  return { id: text(r.id), completedAt, total: 10, score: Number(r.score), questions };
}

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
