import {parseSubscriptionAccess} from "../subscriptions/contract.ts";
type DailyCounter={limit:number|null;used:number;remaining:number|null};
export type DailyLimits = {hasPremium:boolean;accessUntil:string|null;resetsAt:string;practice:DailyCounter;simulations:DailyCounter};
export function parseDailyLimits(value:unknown):DailyLimits {
 if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("invalid_limits");
 const v=value as Record<string,unknown>,access=parseSubscriptionAccess(v);
 if(typeof v.resetsAt!=="string"||!Number.isFinite(Date.parse(v.resetsAt)))throw new Error("invalid_limits");
 const counter=(key:string,freeLimit:number)=>{
  const c=v[key] as Record<string,unknown>|undefined,limit=access.hasPremium?null:freeLimit;
  if(!c||c.limit!==limit||!Number.isSafeInteger(c.used)||Number(c.used)<0||c.remaining!==(limit===null?null:Math.max(0,limit-Number(c.used))))throw new Error("invalid_limits");
  return {limit,used:Number(c.used),remaining:limit===null?null:Number(c.remaining)};
 };
 return {...access,resetsAt:v.resetsAt,practice:counter("practice",10),simulations:counter("simulations",1)};
}
export function dailyLimitMessage(limits:DailyLimits,kind:"practice"|"simulations") {
 if(limits.hasPremium)return kind==="practice"?"Premium ativo · Questões sem limite diário.":"Premium ativo · Simulados sem limite diário.";
 return kind==="practice"?`${limits.practice.remaining} de 10 novas questões disponíveis hoje. Renova à meia-noite de São Paulo.`:`${limits.simulations.remaining} de 1 novo simulado disponível hoje. Renova à meia-noite de São Paulo.`;
}
export function nextLimitsRefresh(limits:DailyLimits,now:number) {
 return Math.min(86400000,Math.max(1000,Math.min(Date.parse(limits.resetsAt),limits.hasPremium?Date.parse(limits.accessUntil!):Infinity)-now+1000));
}
