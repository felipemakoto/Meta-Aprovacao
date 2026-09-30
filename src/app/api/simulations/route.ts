import { getVerifiedUser } from "@/lib/auth/user";
import { simulationRpc } from "@/lib/data/simulations";
import { simulationHandlers } from "@/lib/quiz/simulation-http";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const handlers=simulationHandlers({
 user:async()=>{const u=await getVerifiedUser();return u?.email_confirmed_at?u.id:null;},
 catalog:user=>simulationRpc("simulation_catalog",{p_user_id:user}),
 read:(user,id)=>simulationRpc("read_simulation",{p_user_id:user,p_id:id}),
 run:(user,input)=>input.action==="start"?simulationRpc("start_simulation",{p_user_id:user,p_simulation_id:input.id}):simulationRpc("submit_simulation",{p_user_id:user,p_id:input.id,p_answers:input.answers}),
},{secure:process.env.NODE_ENV==="production",origin:process.env.APP_ORIGIN});
export const {GET,POST}=handlers;
