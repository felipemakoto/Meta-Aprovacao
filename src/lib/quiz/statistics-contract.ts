import { isHistoryId } from "./history-contract.ts";
export const subjectNames={matematica:"Matemática",portugues:"Português",ciencias:"Ciências",historia:"História",geografia:"Geografia"} as const;
export type Period="all"|"30d";
export type StudyStatistics={period:Period;asOf:string;answered:number;correct:number;simulations:number;subjects:{subject:keyof typeof subjectNames;answered:number;correct:number}[];recent:{id:string;title:string;at:string;score:number;total:number}[]};
function object(v:unknown):Record<string,unknown>{if(!v||typeof v!=="object"||Array.isArray(v))throw Error("invalid_statistics");return v as Record<string,unknown>;}
function count(v:unknown):number{if(!Number.isSafeInteger(v)||Number(v)<0)throw Error("invalid_statistics");return Number(v);}
function time(v:unknown):string{if(typeof v!=="string"||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(v)||!Number.isFinite(Date.parse(v)))throw Error("invalid_statistics");return v;}
export function statisticsQuery(url:URL):Period{
 const p=url.searchParams;if([...p.keys()].some(k=>k!=="period")||p.getAll("period").length>1)throw Error("invalid_input");const period=p.get("period")??"all";if(period!=="all"&&period!=="30d")throw Error("invalid_input");return period;
}
export function parseStatistics(v:unknown,period:Period):StudyStatistics{
 const r=object(v),asOf=time(r.asOf),answered=count(r.answered),correct=count(r.correct),simulations=count(r.simulations);
 if(r.period!==period||correct>answered||!Array.isArray(r.subjects)||r.subjects.length!==5||!Array.isArray(r.recent)||r.recent.length!==Math.min(simulations,5)||simulations*5>answered)throw Error("invalid_statistics");
 const rows=r.subjects.map(v=>{const s=object(v);if(typeof s.subject!=="string"||!Object.hasOwn(subjectNames,s.subject))throw Error("invalid_statistics");const answered=count(s.answered),correct=count(s.correct);if(correct>answered)throw Error("invalid_statistics");return {subject:s.subject as keyof typeof subjectNames,answered,correct};});
 if(new Set(rows.map(s=>s.subject)).size!==5||rows.reduce((a,s)=>a+s.answered,0)!==answered||rows.reduce((a,s)=>a+s.correct,0)!==correct)throw Error("invalid_statistics");
 const subjects=Object.keys(subjectNames).map(key=>rows.find(s=>s.subject===key)!);
 const recent=r.recent.map(v=>{const s=object(v);if(!isHistoryId(s.id)||typeof s.title!=="string"||!s.title.trim()||s.title.length>100)throw Error("invalid_statistics");const at=time(s.at),score=count(s.score),total=count(s.total);if(total<5||total>100||score>total||Date.parse(at)>Date.parse(asOf)||(period==="30d"&&Date.parse(at)<Date.parse(asOf)-30*86400000))throw Error("invalid_statistics");return {id:s.id,title:s.title,at,score,total};});
 if(new Set(recent.map(s=>s.id)).size!==recent.length||recent.reduce((n,s)=>n+s.total,0)>answered||recent.reduce((n,s)=>n+s.score,0)>correct||recent.reduce((n,s)=>n+s.total-s.score,0)>answered-correct)throw Error("invalid_statistics");
 for(let i=1;i<recent.length;i++){const a=recent[i-1],b=recent[i];if(Date.parse(a.at)<Date.parse(b.at))throw Error("invalid_statistics");}
 return {period,asOf,answered,correct,simulations,subjects,recent};
}
export function subjectPercentage(answered:number,correct:number):number|null{return answered>=5?Math.round(correct/answered*100):null;}
