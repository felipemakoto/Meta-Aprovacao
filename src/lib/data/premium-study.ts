import "server-only";
import {createHash} from "node:crypto";
import {createAdminClient} from "../supabase/admin";
import {readSubscriptionAccess} from "./subscriptions";
import {parseSubscriptionAccess} from "../subscriptions/contract";
import {parseWorkspace,type StudyCommand} from "../premium-study/contract";
import {generatePlan,localStudyDate} from "../premium-study/planning";
import {verifyOfficialDocument} from "../premium-study/documents";
import {registerStudyDocument} from "../premium-study/document-registration";
const errors=new Set(["login_required","premium_required","invalid_input","invalid_answers","activity_unavailable","activity_limit","institution_unavailable","content_insufficient","plan_changed","rate_limited","review_not_due","attempt_unavailable","draft_conflict"]);
export async function requireStudyPremium(user:string){if(!parseSubscriptionAccess(await readSubscriptionAccess(user)).hasPremium)throw Error("premium_required");}
export async function studyRpc(name:string,args:Record<string,unknown>){
 const {data,error}=await createAdminClient().rpc(name,args).abortSignal(AbortSignal.timeout(15000));
 if(error)throw Error(errors.has(error.message)?error.message:"study_unavailable");return data;
}
export async function readStudyWorkspace(user:string,days=30){return parseWorkspace(await studyRpc("premium_study_workspace",{p_user_id:user,p_days:days}));}
export async function executeStudyCommand(user:string,command:StudyCommand){
 await requireStudyPremium(user);const p={p_user_id:user};
 switch(command.action){
  case "save_profile":return studyRpc("premium_study_profile",{...p,p_config:command.profile});
  case "save_session":return studyRpc("premium_study_session",{...p,p_id:command.id,p_request_id:command.requestId,p_session:command.session});
  case "sync_plan":{
   const w=await readStudyWorkspace(user,30);if(!w.profile)return {changed:false};
   const items=generatePlan(w),fingerprint=createHash("sha256").update(JSON.stringify([w.profile.version,localStudyDate(new Date()),w.groups,w.due,items])).digest("hex");
   if(w.profile.fingerprint===fingerprint)return {changed:false};
   await studyRpc("premium_study_sync_plan",{...p,p_version:w.profile.version,p_fingerprint:fingerprint,p_sessions:items});return {changed:true};
  }
  case "start_exam":return studyRpc("premium_study_start_exam",{...p,p_config:command.config,p_request_id:command.requestId});
  case "save_exam":return studyRpc("premium_study_save_exam",{...p,p_id:command.id,p_answers:command.answers,p_marked:command.marked,p_revision:command.revision});
  case "finish_exam":return studyRpc("premium_study_finish_exam",{...p,p_id:command.id,p_answers:command.answers});
  case "rate_card":return studyRpc("premium_study_rate",{...p,p_question_id:command.questionId,p_mode:command.mode,p_rating:command.rating,p_request_id:command.requestId});
  case "register_document":return registerStudyDocument(command.document,{
   reserve:async()=>{const lease=await studyRpc("reserve_document_verification",p);if(typeof lease!=="string"||!/^[a-f0-9-]{36}$/.test(lease))throw Error("study_unavailable");return lease;},
   verify:verifyOfficialDocument,
   save:document=>studyRpc("premium_study_document",{...p,p_document:document}),
   release:async lease=>{await studyRpc("release_document_verification",{...p,p_lease:lease});},
  });
 }
}
