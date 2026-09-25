import { notFound } from "next/navigation";
import { connection } from "next/server";
import Quiz from "../quiz";
import type { GuestQuiz } from "@/lib/quiz/contract";
export const dynamic = "force-dynamic";
export default async function QuizPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  await connection();
  // eslint-disable-next-line react-hooks/purity -- Server Component dinâmico: relógio da requisição após connection(), conforme guia do Next.
  const now = Date.now();
  // Fixture visual repetida para testar navegação; sem gabarito ou fallback da API.
  const quiz: GuestQuiz = {
    id: "local-preview", startedAt: new Date(now).toISOString(), expiresAt: new Date(now + 1800000).toISOString(), questionCount: 10,
    questions: Array.from({ length: 10 }, (_, index) => ({
      id: `preview-${index + 1}`, position: index + 1, version: 1, subject: "matematica", topic: "Porcentagem",
      statement: "Uma mochila custa R$ 80,00. Com 15% de desconto, qual é o preço final?",
      options: ["R$ 12,00", "R$ 68,00", "R$ 65,00", "R$ 72,00", "R$ 92,00"],
    })),
  };
  return <Quiz preview={quiz} />;
}
