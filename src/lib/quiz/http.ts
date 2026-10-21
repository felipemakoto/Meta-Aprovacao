import { NextRequest, NextResponse } from "next/server.js";
import type { GuestQuiz } from "./contract";

type Dependencies = {
  read: (token: string | undefined) => Promise<GuestQuiz | null>;
  start: (token: string | undefined) => Promise<{ quiz: GuestQuiz; token: string; created: boolean }>;
  isNotReady: (error: unknown) => boolean;
  isRateLimited?: (error: unknown) => boolean;
};

// Dependências explícitas permitem testar cookies e CSRF sem credenciais reais.
export function createGuestQuizHandlers(dependencies: Dependencies, settings: { secure: boolean; origin?: string }) {
  const headers = { "Cache-Control": "private, no-store, max-age=0", Pragma: "no-cache", Expires: "0" };
  const secure = settings.secure;
  const cookieName = secure ? "__Host-guest_quiz" : "guest_quiz";

  function allowedOrigin(request: NextRequest) {
    const origin = request.headers.get("origin");
    const configured = settings.origin;
    if (configured) {
      const url = new URL(configured);
      if (secure && url.protocol !== "https:") return false;
      return origin === url.origin;
    }
    // Apenas desenvolvimento local. Em produção a origem precisa ser explícita.
    return !secure && ["http://localhost:3000", "http://127.0.0.1:3000"].includes(origin ?? "");
  }

  function json(data: unknown, status: number) {
    return NextResponse.json(data, { status, headers });
  }

  async function POST(request: NextRequest) {
    try {
      if (request.headers.get("sec-fetch-site") === "cross-site" || !allowedOrigin(request)) {
        return json({ error: "invalid_origin" }, 403);
      }
      // Nenhum ID, questão, pontuação ou expiração pode ser escolhido pelo cliente.
      if (request.nextUrl.search) return json({ error: "unexpected_input" }, 400);
      // Next pode representar um POST vazio como stream não nulo.
      // Verificar os bytes e parar no primeiro conteúdo, sem acumular o corpo.
      if (request.body) {
        const reader = request.body.getReader();
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const empty = await Promise.race([
            (async () => { for (;;) {
              const { done, value } = await reader.read();
              if (done) return true;
              if (value.byteLength > 0) return false;
            } })(),
            new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), 3000); }),
          ]);
          if (empty === null) return json({ error: "request_timeout" }, 408);
          if (!empty) return json({ error: "unexpected_input" }, 400);
        } finally {
          clearTimeout(timer);
          void reader.cancel().catch(() => {});
          try { reader.releaseLock(); } catch { /* A pending read cannot delay the deadline. */ }
        }
      }
      const result = await dependencies.start(request.cookies.get(cookieName)?.value);
      const response = json(result.quiz, result.created ? 201 : 200);
      response.cookies.set(cookieName, result.token, {
        httpOnly: true, secure, sameSite: "strict", path: "/",
        maxAge: Math.max(0, Math.floor((Date.parse(result.quiz.expiresAt) - Date.now()) / 1000)),
      });
      return response;
    } catch (error) {
      if (dependencies.isRateLimited?.(error)) {
        const response = json({ error: "rate_limited" }, 429);
        response.headers.set("Retry-After", "600");
        return response;
      }
      return json({ error: dependencies.isNotReady(error) ? "quiz_not_ready" : "quiz_unavailable" }, 503);
    }
  }

  async function GET(request: NextRequest) {
    if (request.headers.get("sec-fetch-site") === "cross-site") return json({ error: "invalid_origin" }, 403);
    if (request.nextUrl.search) return json({ error: "unexpected_input" }, 400);
    try {
      const quiz = await dependencies.read(request.cookies.get(cookieName)?.value);
      return quiz ? json(quiz, 200) : json({ error: "attempt_unavailable" }, 401);
    } catch {
      return json({ error: "quiz_unavailable" }, 503);
    }
  }

  return { GET, POST };
}
