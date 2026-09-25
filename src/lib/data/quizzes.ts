import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { toPublicQuiz, type GuestQuiz } from "../quiz/contract";
import { createAdminClient } from "../supabase/admin";

export class QuizNotReadyError extends Error {}

export function isGuestToken(value: string | undefined): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function readGuestQuiz(token: string | undefined): Promise<GuestQuiz | null> {
  if (!isGuestToken(token)) return null;
  const { data, error } = await createAdminClient().rpc("read_guest_quiz", { p_token_hash: hashToken(token) });
  if (error) throw new Error("Guest quiz unavailable");
  return data ? toPublicQuiz(data) : null;
}

export async function startGuestQuiz(previousToken: string | undefined) {
  const previous = await readGuestQuiz(previousToken);
  if (previous && previousToken) return { quiz: previous, token: previousToken, created: false };
  const token = randomBytes(32).toString("hex");
  const { data, error } = await createAdminClient().rpc("start_guest_quiz", { p_token_hash: hashToken(token) });
  if (error?.code === "P0001" && error.message === "quiz_not_ready") throw new QuizNotReadyError();
  if (error || !data) throw new Error("Guest quiz unavailable");
  return { quiz: toPublicQuiz(data), token, created: true };
}
