import { statisticsQuery,parseStatistics,type Period } from "./statistics-contract.ts";
export function statisticsHandler(deps:{user:()=>Promise<string|null>;read:(user:string,period:Period)=>Promise<unknown>}){
 return async(r:Request)=>{
  const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
  if(r.headers.get("sec-fetch-site")==="cross-site")return json({error:"invalid_origin"},403);
  try{const user=await deps.user();if(!user)return json({error:"login_required"},401);let period:Period;try{period=statisticsQuery(new URL(r.url));}catch{return json({error:"invalid_input"},400);}return json(parseStatistics(await deps.read(user,period),period));}catch{return json({error:"statistics_unavailable"},503);}
 };
}
