import { parseCatalog,parseSimulationInput,parseSimulationResult,parseSimulationState,type SimulationInput } from "./simulation-contract.ts";
import { isHistoryId } from "./history-contract.ts";
export function simulationHandlers(deps:{user:()=>Promise<string|null>;catalog:(user:string)=>Promise<unknown>;read:(user:string,id:string)=>Promise<unknown>;run:(user:string,input:SimulationInput)=>Promise<unknown>},settings:{secure:boolean;origin?:string}){
 const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
 const failure=(e:unknown)=>{const name=e instanceof Error?e.message:"";const codes:Record<string,number>={login_required:401,attempt_unavailable:404,simulation_unavailable:404,already_submitted:409,invalid_answers:400,rate_limited:429,daily_simulation_limit:403};return json({error:codes[name]?name:"simulation_unavailable"},codes[name]??503);};
 async function GET(r:Request){
  if(r.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
  try{const user=await deps.user();if(!user)return json({error:"login_required"},401);
   const p=new URL(r.url).searchParams,id=p.get("id");if([...p.keys()].some(k=>k!=="id")||p.getAll("id").length>1||(id!==null&&!isHistoryId(id)))return json({error:"invalid_input"},400);
   if(id===null)return json({items:parseCatalog(await deps.catalog(user))});
   const value=await deps.read(user,id);return value?json(parseSimulationState(value)):json({error:"attempt_unavailable"},404);
  }catch(e){return failure(e);}
 }
 async function POST(r:Request){
  let allowed=false;try{const origin=settings.origin?new URL(settings.origin):null;allowed=origin?(!settings.secure||origin.protocol==="https:")&&r.headers.get("origin")===origin.origin:!settings.secure&&["http://localhost:3000","http://127.0.0.1:3000"].includes(r.headers.get("origin")??"");}catch{}
  if(!allowed||r.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
  if(new URL(r.url).search)return json({error:"invalid_input"},400);
  if(r.headers.get("content-type")?.split(";")[0].trim()!=="application/json")return json({error:"unsupported_media_type"},415);
  if(Number(r.headers.get("content-length"))>16000)return json({error:"payload_too_large"},413);
  // Limite também para streaming sem Content-Length.
  const reader=r.body?.getReader();if(!reader)return json({error:"invalid_input"},400);
  let timeout=false;const timer=setTimeout(()=>{timeout=true;void reader.cancel();},5000);
  let input:SimulationInput;
  try{const chunks:Uint8Array[]=[];let size=0;for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>16000)return json({error:"payload_too_large"},413);chunks.push(value);}if(timeout)return json({error:"request_timeout"},408);input=parseSimulationInput(JSON.parse(Buffer.concat(chunks).toString("utf8")));}
  catch{return json({error:"invalid_input"},400);}finally{clearTimeout(timer);await reader.cancel().catch(()=>{});reader.releaseLock();}
  try{const user=await deps.user();if(!user)return json({error:"login_required"},401);const value=await deps.run(user,input);return json(input.action==="start"?parseSimulationState(value):{result:parseSimulationResult(value)});}catch(e){return failure(e);}
 }
 return {GET,POST};
}
