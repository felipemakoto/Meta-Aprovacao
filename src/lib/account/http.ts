import {readAuthJson,AuthBodyError} from "../auth/request-body.ts";
import {parseAccountCommand} from "./contract.ts";
export function accountHandlers(deps:{user:()=>Promise<string|null>;read:(user:string)=>Promise<unknown>;reserve:(user:string)=>Promise<void>;execute:(user:string,command:ReturnType<typeof parseAccountCommand>)=>Promise<unknown>;avatar:(user:string)=>Promise<string|null>},settings:{origin?:string;secure:boolean}){
 const headers={"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"};
 const json=(v:unknown,status=200)=>Response.json(v,{status,headers});
 const failure=(e:unknown)=>{if(e instanceof AuthBodyError)return json({error:e.message},e.status);const code=e instanceof Error?e.message:"",codes:Record<string,number>={login_required:401,invalid_input:400,invalid_image:422,upload_too_large:413,rate_limited:429};return json({error:codes[code]?code:"profile_unavailable"},codes[code]??503);};
 async function identity(r:Request,avatar=false){
  const params=new URL(r.url).searchParams;
  if(r.headers.get("sec-fetch-site")==="cross-site"||(!avatar&&params.size)||(avatar&&([...params.keys()].some(k=>k!=="v")||params.getAll("v").length>1||(params.has("v")&&!/^[a-f0-9-]{36}$/.test(params.get("v")!)))))throw Error("invalid_input");
  const user=await deps.user();if(!user)throw Error("login_required");return user;
 }
 return {
  async GET(r:Request){try{return json(await deps.read(await identity(r)));}catch(e){return failure(e);}},
  async POST(r:Request){
   let allowed=false;try{const u=new URL(settings.origin??"");allowed=u.origin===r.headers.get("origin")&&(!settings.secure||u.protocol==="https:")&&!u.username&&!u.password&&u.pathname==="/"&&!u.search&&!u.hash;}catch{}
   if(!allowed||r.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
   try{
    const user=await identity(r);
    if(r.headers.get("content-type")?.split(";")[0].trim()!=="application/json")return json({error:"invalid_input"},415);
    const command=parseAccountCommand(await readAuthJson(r,2800000));
    await deps.reserve(user);return json(await deps.execute(user,command));
   }catch(e){return failure(e);}
  },
  async AVATAR(r:Request){try{const body=await deps.avatar(await identity(r,true));if(!body)return new Response(null,{status:404,headers});return new Response(Buffer.from(body,"base64"),{headers:{...headers,"Content-Type":"image/webp","Content-Disposition":"inline"}});}catch(e){return failure(e);}},
 };
}
