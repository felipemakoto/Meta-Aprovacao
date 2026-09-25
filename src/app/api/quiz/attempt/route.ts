import { QuizNotReadyError, readGuestQuiz, startGuestQuiz } from "@/lib/data/quizzes";
import { createGuestQuizHandlers } from "@/lib/quiz/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handlers = createGuestQuizHandlers({
  read: readGuestQuiz,
  start: startGuestQuiz,
  isNotReady: (error) => error instanceof QuizNotReadyError,
}, { secure: process.env.NODE_ENV === "production", origin: process.env.APP_ORIGIN });

export const GET = handlers.GET;
export const POST = handlers.POST;
