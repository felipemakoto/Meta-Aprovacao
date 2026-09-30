export type GuestQuiz = {
  id: string;
  startedAt: string;
  expiresAt: string;
  questionCount: number;
  questions: {
    position: number; id: string; version: number; subject: string;
    topic: string; statement: string; options: string[];
  }[];
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid quiz data");
  return value as Record<string, unknown>;
}
function text(value: unknown): string {
  if (typeof value !== "string" || !value) throw new Error("Invalid quiz field");
  return value;
}
function integer(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) throw new Error("Invalid quiz number");
  return value;
}

// Lista explícita de campos; nunca devolver o resultado bruto de uma consulta.
export function toPublicQuiz(value: unknown, count = 10): GuestQuiz {
  const row = record(value);
  if (!Number.isInteger(count) || count < 5 || count > 100 || !Array.isArray(row.questions) || row.questions.length !== count || row.questionCount !== count) {
    throw new Error("Incomplete quiz");
  }
  const expiresAt = text(row.expiresAt);
  if (!Number.isFinite(Date.parse(expiresAt))) throw new Error("Invalid expiry");
  return {
    id: text(row.id), startedAt: text(row.startedAt), expiresAt, questionCount: count,
    questions: row.questions.map((value) => {
      const q = record(value);
      if (!Array.isArray(q.options) || q.options.length !== 5) throw new Error("Invalid options");
      return {
        position: integer(q.position), id: text(q.id), version: integer(q.version),
        subject: text(q.subject), topic: text(q.topic), statement: text(q.statement),
        options: q.options.map(text),
      };
    }),
  };
}
