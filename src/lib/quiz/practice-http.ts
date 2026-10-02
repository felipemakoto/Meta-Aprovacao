import { NextRequest, NextResponse } from "next/server.js";
import { parsePracticeInput, publicQuestion, publicFeedback, subjects } from "./practice-contract.ts";
type Input = ReturnType<typeof parsePracticeInput>;
export function createPracticeHandlers(deps: { user:()=>Promise<string|null>; topics:(subject:string)=>Promise<unknown>; run:(user:string,input:Input)=>Promise<unknown> }, settings:{secure:boolean;origin?:string}) {
  const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store, max-age=0",Pragma:"no-cache"}});
  const fail=(e:unknown)=>{
    const name=e instanceof Error?e.message:"";
    const status:Record<string,number>={attempt_unavailable:404,already_answered:409,rate_limited:429,login_required:401,daily_practice_limit:403};
    return json({error:status[name]?name:"practice_unavailable"},status[name]??503);
  };
  async function GET(r:NextRequest) {
    if(r.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
    const keys=[...r.nextUrl.searchParams.keys()];const subject=r.nextUrl.searchParams.get("subject");
    if(keys.length!==1 || keys[0]!=="subject" || !subject || !Object.hasOwn(subjects,subject))return json({error:"invalid_input"},400);
    try { if(!await deps.user())return json({error:"login_required"},401);
      const topics=await deps.topics(subject);
      if(!Array.isArray(topics)||topics.length>200||topics.some(t=>typeof t!=="string"||t.length>160))throw new Error();
      return json({topics});
    }catch(e){return fail(e);}
  }
  async function POST(r:NextRequest) {
    let allowed=false;
    try { const origin=settings.origin?new URL(settings.origin):null;
      allowed=origin?(!settings.secure||origin.protocol==="https:")&&r.headers.get("origin")===origin.origin:!settings.secure&&["http://localhost:3000","http://127.0.0.1:3000"].includes(r.headers.get("origin")??"");
    }catch{}
    if(!allowed||r.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
    if(r.nextUrl.search)return json({error:"invalid_input"},400);
    if(r.headers.get("content-type")?.split(";")[0].trim()!=="application/json")return json({error:"unsupported_media_type"},415);
    if(Number(r.headers.get("content-length"))>2048)return json({error:"payload_too_large"},413);
    const reader=r.body?.getReader();if(!reader)return json({error:"invalid_input"},400);
    let timeout=false; const timer=setTimeout(()=>{timeout=true;void reader.cancel();},5000);
    let input:Input;
    try {const chunks:Uint8Array[]=[];let size=0;
      for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048)return json({error:"payload_too_large"},413);chunks.push(value);}
      if(timeout)return json({error:"request_timeout"},408);
      input=parsePracticeInput(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    }catch{return json({error:"invalid_input"},400);}finally{clearTimeout(timer);await reader.cancel().catch(()=>{});reader.releaseLock();}
    try {const user=await deps.user();if(!user)return json({error:"login_required"},401);
      const value=await deps.run(user,input);
      return json(input.action==="next"?{question:value?publicQuestion(value):null}:{feedback:publicFeedback(value)});
    }catch(e){return fail(e);}
  }
  return {GET,POST};
}
