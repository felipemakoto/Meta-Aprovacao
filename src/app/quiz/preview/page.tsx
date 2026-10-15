import { notFound } from "next/navigation";
import { connection } from "next/server";
import Quiz from "../quiz";
import type { GuestQuiz } from "@/lib/quiz/contract";
import catalog from "../../../../content/quiz-inicial.json";
export const dynamic = "force-dynamic";
export default async function QuizPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  await connection();
  // eslint-disable-next-line react-hooks/purity -- Server Component dinâmico: relógio da requisição após connection(), conforme guia do Next.
  const now = Date.now();
  // The server projects only public fields, even for the local preview.
  const quiz: GuestQuiz = {
    id: "local-preview", startedAt: new Date(now).toISOString(), expiresAt: new Date(now + 1800000).toISOString(), questionCount: 10,
    questions: catalog.questions.map(q=>({id:q.id,position:q.position,version:1,subject:q.subject,topic:q.topic,statement:q.statement,options:q.options})),
  };
  return <Quiz preview={quiz} />;
}
