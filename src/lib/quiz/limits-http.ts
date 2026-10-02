import {parseDailyLimits} from "./limits-contract.ts";
export function limitsHandler(deps:{user:()=>Promise<string|null>;read:(user:string)=>Promise<unknown>}){
 const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
 return async function GET(request:Request){
  if(request.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
  try{
   const user=await deps.user();if(!user)return json({error:"login_required"},401);
   if(new URL(request.url).search)return json({error:"invalid_input"},400);
   return json(parseDailyLimits(await deps.read(user)));
  }catch{return json({error:"limits_unavailable"},503);}
 };
}
