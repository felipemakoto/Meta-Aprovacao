import { createPracticeHandlers } from "@/lib/quiz/practice-http";
import { getVerifiedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
export const dynamic="force-dynamic";
export const runtime="nodejs";
async function rpc(name:string,args:Record<string,unknown>) {
  const {data,error}=await createAdminClient().rpc(name,args);
  if(error)throw new Error(error.code==="P0001" && ["attempt_unavailable","already_answered","rate_limited","login_required","daily_practice_limit"].includes(error.message)?error.message:"practice_unavailable");
  return data;
}
const handlers=createPracticeHandlers({
  user:async()=>{const u=await getVerifiedUser();return u?.email_confirmed_at?u.id:null;},
  topics:subject=>rpc("practice_topics",{p_subject:subject}),
  run:(user,input)=>input.action==="next"?rpc(input.requestId?"start_question_practice_request":"start_question_practice",{p_user_id:user,p_subject:input.filters.subject,p_topic:input.filters.topic,p_difficulty:input.filters.difficulty,p_exam:input.filters.exam,p_previous:input.previous,...(input.requestId?{p_request_id:input.requestId}:{})}):rpc("answer_question_practice",{p_user_id:user,p_attempt_id:input.id,p_answer:input.answer}),
},{secure:process.env.NODE_ENV==="production",origin:process.env.APP_ORIGIN});
export const {GET,POST}=handlers;
