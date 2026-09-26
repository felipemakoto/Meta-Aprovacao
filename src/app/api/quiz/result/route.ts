import { readGuestQuizResult, submitGuestQuiz } from "@/lib/data/quiz-results";
import { createCorrectionHandlers } from "@/lib/quiz/correction";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handlers = createCorrectionHandlers({ read: readGuestQuizResult, submit: submitGuestQuiz },
  { secure: process.env.NODE_ENV === "production", origin: process.env.APP_ORIGIN });
export const GET = handlers.GET;
export const POST = handlers.POST;
