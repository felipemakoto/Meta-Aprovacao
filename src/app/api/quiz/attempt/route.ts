import { GuestRateLimitedError, QuizNotReadyError, readGuestQuiz, startGuestQuiz } from "@/lib/data/quizzes";
import { createGuestQuizHandlers } from "@/lib/quiz/http";
import { guestClientHash } from "@/lib/quiz/guest-rate-limit";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function handlers(request?: Request) { return createGuestQuizHandlers({
  read: readGuestQuiz,
  start: token => startGuestQuiz(token, guestClientHash(request!, process.env.SUPABASE_SECRET_KEY ?? "", process.env.VERCEL === "1")),
  isNotReady: (error) => error instanceof QuizNotReadyError,
  isRateLimited: (error) => error instanceof GuestRateLimitedError,
}, { secure: process.env.NODE_ENV === "production", origin: process.env.APP_ORIGIN }); }

export const GET = (request: NextRequest) => handlers().GET(request);
export const POST = (request: NextRequest) => handlers(request).POST(request);
