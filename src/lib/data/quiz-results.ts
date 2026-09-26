import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "../supabase/admin";
import { toQuizResult, type Answers } from "../quiz/correction";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");
export async function submitGuestQuiz(token: string, answers: Answers) {
  const { data, error } = await createAdminClient().rpc("submit_guest_quiz", { p_token_hash: hash(token), p_answers: answers });
  if (error) {
    const allowed = (error.code === "P0001" && ["attempt_unavailable", "attempt_already_submitted"].includes(error.message)) ||
      (error.code === "22023" && error.message === "invalid_answers");
    throw new Error(allowed ? error.message : "quiz_unavailable");
  }
  return toQuizResult(data);
}
export async function readGuestQuizResult(token: string) {
  const { data, error } = await createAdminClient().rpc("read_guest_quiz_result", { p_token_hash: hash(token) });
  if (error) throw new Error("quiz_unavailable");
  return data ? toQuizResult(data) : null;
}
