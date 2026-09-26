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

// Allowlist de feedback: somente usado depois de a RPC confirmar a finalizaÃ§Ã£o.
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

