import { notFound } from "next/navigation";
import Result from "../result";
import type { QuizResult } from "@/lib/quiz/result-contract";

export const dynamic = "force-dynamic";
export default async function ResultPreview({ searchParams }: { searchParams: Promise<{ score?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { score } = await searchParams;
  const topics = [
    ["matematica", "Porcentagem", "Uma mochila custa R$ 80,00. Com 15% de desconto, qual é o preço final?", ["R$ 12,00", "R$ 68,00", "R$ 65,00", "R$ 72,00", "R$ 92,00"], "B", "15% de R$ 80,00 são R$ 12,00. Subtraindo o desconto: 80 − 12 = 68."],
    ["ciencias", "Ecologia", "Qual organismo atua como produtor em uma cadeia alimentar?", ["Capim", "Gafanhoto", "Sapo", "Cobra", "Gavião"], "A", "O capim produz seu próprio alimento pela fotossíntese e constitui a base dessa cadeia alimentar."],
    ["historia", "Brasil Colônia", "Qual produto teve destaque na economia colonial portuguesa no Brasil do século XVI?", ["Café", "Borracha", "Açúcar", "Petróleo", "Automóveis"], "C", "A produção de açúcar em engenhos teve destaque na economia colonial, especialmente no litoral nordestino."],
  ] as const;
  // Fixture exclusivamente visual. Não representa uma tentativa nem acessa gabaritos do banco.
  const questions: QuizResult["questions"] = Array.from({ length: 10 }, (_, index) => {
    const q = topics[index % topics.length];
    const correct = score === "0" ? false : score === "10" ? true : index >= 3;
    const wrong = index === 0 ? "D" : q[4] === "A" ? "B" : "A";
    return { id: `example-${index}`, position: index + 1, subject: q[0], topic: q[1], statement: q[2],
      options: [...q[3]], correctAnswer: q[4], answer: correct ? q[4] : wrong, correct, explanation: q[5] };
  });
  return <Result preview={{ id: "visual-example", completedAt: "2026-09-26T00:00:00Z", total: 10,
    score: questions.filter(q => q.correct).length, questions }} />;
}
