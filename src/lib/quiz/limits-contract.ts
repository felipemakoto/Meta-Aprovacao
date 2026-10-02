export type DailyLimits = {resetsAt:string;practice:{limit:number;used:number;remaining:number};simulations:{limit:number;used:number;remaining:number}};
export function parseDailyLimits(value:unknown):DailyLimits {
 if(!value||typeof value!=="object")throw new Error("invalid_limits");
 const v=value as Record<string,unknown>;
 if(typeof v.resetsAt!=="string"||!Number.isFinite(Date.parse(v.resetsAt)))throw new Error("invalid_limits");
 const counter=(key:string,limit:number)=>{
  const c=v[key] as Record<string,unknown>|undefined;
  if(!c||c.limit!==limit||!Number.isSafeInteger(c.used)||Number(c.used)<0||c.remaining!==Math.max(0,limit-Number(c.used)))throw new Error("invalid_limits");
  return {limit,used:Number(c.used),remaining:Number(c.remaining)};
 };
 return {resetsAt:v.resetsAt,practice:counter("practice",10),simulations:counter("simulations",1)};
}
