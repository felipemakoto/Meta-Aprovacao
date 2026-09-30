export const subjects = { matematica: "Matemática", portugues: "Português", ciencias: "Ciências", historia: "História", geografia: "Geografia" };
export type Filters = { subject: string; topic: string; difficulty: string; exam: string };
export type PracticeQuestion = { id: string; questionId: string; expiresAt: string; subject: string; topic: string; statement: string; options: string[] };
export type PracticeFeedback = { answer: string; correct: boolean; correctAnswer: string; explanation: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function obj(v: unknown): Record<string, unknown> { if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("invalid_input"); return v as Record<string, unknown>; }
export function parsePracticeInput(v: unknown) {
  const b = obj(v);
  if (b.action === "answer" && Object.keys(b).sort().join() === "action,answer,id" && typeof b.id === "string" && uuid.test(b.id) && typeof b.answer === "string" && /^[A-E]$/.test(b.answer)) return { action: "answer" as const, id: b.id, answer: b.answer };
  if (b.action === "next" && Object.keys(b).sort().join() === "action,filters,previous") {
    const f = obj(b.filters);
    if (Object.keys(f).sort().join() !== "difficulty,exam,subject,topic" || typeof f.subject !== "string" || !Object.hasOwn(subjects,f.subject) || typeof f.topic !== "string" || f.topic.length>160 || typeof f.difficulty !== "string" || !["all","easy","medium","hard"].includes(f.difficulty) || typeof f.exam !== "string" || !["all","etec","if"].includes(f.exam) || !(b.previous===null || typeof b.previous === "string" && uuid.test(b.previous))) throw new Error("invalid_input");
    return { action: "next" as const, filters: f as Filters, previous: b.previous as string | null };
  }
  throw new Error("invalid_input");
}
export function publicQuestion(v: unknown): PracticeQuestion {
  const q = obj(v);
  if (typeof q.id !== "string" || !uuid.test(q.id) || typeof q.questionId !== "string" || !uuid.test(q.questionId) || typeof q.expiresAt !== "string" || !Number.isFinite(Date.parse(q.expiresAt)) || typeof q.subject !== "string" || !Object.hasOwn(subjects,q.subject) || typeof q.topic !== "string" || typeof q.statement !== "string" || !q.statement || !Array.isArray(q.options) || q.options.length!==5 || q.options.some(x=>typeof x!=="string" || !x)) throw new Error("invalid_data");
  return { id:q.id,questionId:q.questionId,expiresAt:q.expiresAt,subject:q.subject,topic:q.topic,statement:q.statement,options:q.options };
}
export function publicFeedback(v: unknown): PracticeFeedback {
  const q = obj(v);
  if (typeof q.answer !== "string" || !/^[A-E]$/.test(q.answer) || typeof q.correctAnswer !== "string" || !/^[A-E]$/.test(q.correctAnswer) || q.correct !== (q.answer===q.correctAnswer) || typeof q.explanation !== "string" || !q.explanation) throw new Error("invalid_data");
  return {answer:q.answer,correct:q.correct as boolean,correctAnswer:q.correctAnswer,explanation:q.explanation};
}
