import {readAuthJson,AuthBodyError} from "../auth/request-body.ts";
import {parseDirectInput,type DirectInput,type DirectState} from "./direct-contract.ts";
export function directHandlers(deps:{user:()=>Promise<{id:string;email:string}|null>;view:(user:string)=>Promise<DirectState>;execute:(user:{id:string;email:string},input:DirectInput)=>Promise<DirectState>},settings:{enabled:boolean;origin?:string;secure:boolean}){
 const headers={"Cache-Control":"private, no-store, max-age=0","Referrer-Policy":"no-referrer","X-Content-Type-Options":"nosniff"};
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers});
 const failure=(e:unknown)=>{if(e instanceof AuthBodyError)return json({error:e.message},e.status);const code=e instanceof Error?e.message:"",codes:Record<string,number>={invalid_input:400,login_required:401,already_premium:409,checkout_rate_limited:429,payment_not_found:404};return json({error:codes[code]?code:"direct_unavailable"},codes[code]??503);};
 async function identity(r:Request){if(new URL(r.url).search||r.headers.get("sec-fetch-site")==="cross-site")throw Error("invalid_input");const user=await deps.user();if(!user)throw Error("login_required");return user;}
 return {
  async GET(r:Request){try{const user=await identity(r);return json(await deps.view(user.id));}catch(e){return failure(e);}},
  async POST(r:Request){
   let allowed=false;try{const origin=new URL(settings.origin??"");allowed=!origin.username&&!origin.password&&origin.pathname==="/"&&!origin.search&&!origin.hash&&(!settings.secure||origin.protocol==="https:")&&r.headers.get("origin")===origin.origin;}catch{/* Deny malformed configured origin. */}
   if(!allowed||r.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
   try{const user=await identity(r);if(r.headers.get("content-type")?.split(";")[0].trim()!=="application/json")throw Error("invalid_input");const command=parseDirectInput(await readAuthJson(r,8192));if(!settings.enabled&&command.action!=="refresh")throw Error("direct_unavailable");return json(await deps.execute(user,command));}catch(e){return failure(e);}
  },
 };
}
