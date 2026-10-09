import {timingSafeEqual,createHmac} from "node:crypto";
import {Buffer} from "node:buffer";
export function automationHeaders(secret:string,nonce:string,now:number) {
 const stamp=String(Math.floor(now/1000)),mac=createHmac("sha256",secret).update(`${stamp}.${nonce}.cakto-reconcile`).digest("hex");
 return {Authorization:`Bearer ${nonce}.${mac}`,"X-Cakto-Worker-Timestamp":stamp,"Content-Type":"application/json"};
}
export function automationHandler(deps:{secret:()=>string;authorize:(nonce:string)=>Promise<boolean>;run:()=>Promise<unknown>;now?:()=>number}) {
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 return async(request:Request)=>{
  const secret=deps.secret(),header=request.headers.get("authorization")??"";
  if(!/^[a-f0-9]{64}$/.test(secret))return json({error:"automation_unavailable"},503);
  const stamp=request.headers.get("x-cakto-worker-timestamp")??"",match=/^Bearer ([a-f0-9]{64})\.([a-f0-9]{64})$/.exec(header);
  if(!match||!/^\d{10}$/.test(stamp)||Math.abs((deps.now??Date.now)()/1000-Number(stamp))>90)return json({error:"unauthorized"},401);
  const expected=createHmac("sha256",secret).update(`${stamp}.${match[1]}.cakto-reconcile`).digest("hex");
  if(!timingSafeEqual(Buffer.from(match[2]),Buffer.from(expected)))return json({error:"unauthorized"},401);
  if(request.method!=="POST")return json({error:"method_not_allowed"},405);
  if(new URL(request.url).search||request.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_request"},400);
  // No identifiers, mode, plan or user can be supplied by the caller.
  const reader=request.body?.getReader();if(!reader)return json({error:"invalid_request"},400);
  const controller=new AbortController();const timer=setTimeout(()=>{controller.abort();void reader.cancel();},1000);
  try {let text="";for(;;){const {done,value}=await reader.read();if(done)break;if(value.length>16||text.length+value.length>16)return json({error:"invalid_request"},400);text+=new TextDecoder().decode(value);}
   if(controller.signal.aborted||text.trim()!=="{}")return json({error:"invalid_request"},400);
  }catch{return json({error:"invalid_request"},400);}finally{clearTimeout(timer);void reader.cancel().catch(()=>{});}
  try{if(!await deps.authorize(match[1]))return json({error:"unauthorized"},401);return json(await deps.run());}catch{return json({error:"automation_unavailable"},503);}
 };
}
