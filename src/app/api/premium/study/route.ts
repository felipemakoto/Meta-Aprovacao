import {getVerifiedUser} from "@/lib/auth/user";
import {studyHandlers} from "@/lib/premium-study/http";
import {executeStudyCommand,readStudyWorkspace,requireStudyPremium,studyRpc} from "@/lib/data/premium-study";
import {calendarIcs} from "@/lib/premium-study/planning";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const {GET,POST}=studyHandlers({
 user:async()=>{const u=await getVerifiedUser();return u?.email_confirmed_at?u.id:null;},require:requireStudyPremium,
 read:readStudyWorkspace,cards:(user,subject,topic,mode)=>studyRpc("premium_study_cards",{p_user_id:user,p_subject:subject,p_topic:topic,p_mode:mode}),
 calendar:async user=>calendarIcs((await readStudyWorkspace(user)).sessions),execute:executeStudyCommand,
},{origin:process.env.APP_ORIGIN,secure:process.env.NODE_ENV==="production"});
