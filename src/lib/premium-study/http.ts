import {readAuthJson,AuthBodyError} from "../auth/request-body.ts";
import {parseStudyCommand} from "./contract.ts";
import {subjects} from "../quiz/practice-contract.ts";
export function studyHandlers(deps:{user:()=>Promise<string|null>;require:(user:string)=>Promise<void>;read:(user:string,days:number)=>Promise<unknown>;cards:(user:string,subject:string,topic:string,mode:string)=>Promise<unknown>;calendar:(user:string)=>Promise<string>;execute:(user:string,command:ReturnType<typeof parseStudyCommand>)=>Promise<unknown>},settings:{origin?:string;secure:boolean}){
 const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
 const json=(v:unknown,status=200)=>Response.json(v,{status,headers});
 const fail=(e:unknown)=>{if(e instanceof AuthBodyError)return json({error:e.message},e.status);
  const name=e instanceof Error?e.message:"",codes:Record<string,number>={login_required:401,premium_required:403,invalid_input:400,invalid_answers:400,invalid_document:400,activity_unavailable:404,activity_limit:429,institution_unavailable:404,content_insufficient:422,plan_changed:409,review_not_due:409,attempt_unavailable:404,draft_conflict:409,rate_limited:429,source_unavailable:503,source_links_missing:422};return json({error:codes[name]?name:"study_unavailable"},codes[name]??503);};
 async function identity(){const user=await deps.user();if(!user)throw Error("login_required");await deps.require(user);return user;}
 async function GET(r:Request){
  if(r.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
  try{
   const query=new URL(r.url).searchParams,keys=[...query.keys()];if(new Set(keys).size!==keys.length)throw Error("invalid_input");
   const view=query.get("view")??"workspace";
   if(view==="workspace"){
    if(keys.some(k=>!["view","days"].includes(k)))throw Error("invalid_input");const raw=query.get("days")??"30";
    if(!["0","7","30","90"].includes(raw))throw Error("invalid_input");return json(await deps.read(await identity(),Number(raw)));
   }
   if(view==="cards"){
    if(keys.some(k=>!["view","subject","topic","mode"].includes(k)))throw Error("invalid_input");
    const subject=query.get("subject")??"",topic=query.get("topic")??"",mode=query.get("mode")??"flashcard";
    if((subject&&!Object.hasOwn(subjects,subject))||topic.length>160||!["review","flashcard"].includes(mode))throw Error("invalid_input");
    return json({cards:await deps.cards(await identity(),subject,topic,mode)});
   }
   if(view==="calendar"&&keys.length===1){const text=await deps.calendar(await identity());return new Response(text,{headers:{...headers,"Content-Type":"text/calendar; charset=utf-8","Content-Disposition":'attachment; filename="meta-aprovacao-estudos.ics"'}});}
   throw Error("invalid_input");
  }catch(e){return fail(e);}
 }
 async function POST(r:Request){
  let allowed=false;try{const u=new URL(settings.origin??"");allowed=(!settings.secure||u.protocol==="https:")&&u.origin===r.headers.get("origin")&&!u.username&&!u.password&&u.pathname==="/"&&!u.search&&!u.hash;}catch{}
  if(!allowed||r.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
  if(new URL(r.url).search)return json({error:"invalid_input"},400);
  if(r.headers.get("content-type")?.split(";")[0].trim()!=="application/json")return json({error:"unsupported_media_type"},415);
  try{const user=await identity(),command=parseStudyCommand(await readAuthJson(r,32768));return json({data:await deps.execute(user,command)});}catch(e){return fail(e);}
 }
 return {GET,POST};
}
