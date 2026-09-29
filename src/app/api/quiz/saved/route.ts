import { createHash } from "node:crypto";
import { getVerifiedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClaimHandlers } from "@/lib/quiz/claim-http";
import { toQuizResult } from "@/lib/quiz/result-contract";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const handlers = createClaimHandlers({
  user: async () => {
    const user = await getVerifiedUser();
    return user?.email_confirmed_at ? user.id : null;
  },
  claim: async (token, userId) => {
    const { error } = await createAdminClient().rpc("claim_quiz_result", {
      p_token_hash: createHash("sha256").update(token).digest("hex"), p_user_id: userId,
    });
    if (error) throw new Error(error.code === "P0001" && error.message === "attempt_unavailable" ? "attempt_unavailable" : "quiz_unavailable");
  },
  read: async userId => {
    const { data, error } = await createAdminClient().rpc("read_saved_quiz_result", { p_user_id: userId });
    if (error) throw new Error("quiz_unavailable");
    return data ? toQuizResult(data) : null;
  },
}, { secure: process.env.NODE_ENV === "production", origin: process.env.APP_ORIGIN });
export const { GET, POST } = handlers;
