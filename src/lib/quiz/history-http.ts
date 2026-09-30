import { historyQuery, parseHistory, type HistoryKind, type Cursor } from "./history-contract.ts";
export function historyHandler(deps:{user:()=>Promise<string|null>;read:(user:string,kind:HistoryKind,before:Cursor|null)=>Promise<unknown>}) {
 return async(request:Request)=>{
 const respond=(body:unknown,status:number)=>Response.json(body,{status,headers:{"Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
 try {
  const user=await deps.user();if(!user)return respond({error:"login_required"},401);
  let query;try{query=historyQuery(new URL(request.url));}catch{return respond({error:"invalid_input"},400);}
  return respond(parseHistory(await deps.read(user,query.kind,query.before),query.kind),200);
 }catch{return respond({error:"history_unavailable"},503);}
 };
}

