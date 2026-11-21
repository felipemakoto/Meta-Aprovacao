import { toPublicQuiz, type GuestQuiz } from "./contract.ts";
import { toQuizResult, type QuizResult, type Answers } from "./result-contract.ts";
import { isHistoryId } from "./history-contract.ts";
export type Simulation = { id:string; title:string; count:number; subject:string|null };
export type SimulationResult = QuizResult & { title:string; durationSeconds:number;timed?:true };
export type PremiumExamInfo={mode:"realistic"|"custom";institution:string;durationMinutes:number;reusedQuestions:number;sourceUrl:string;verifiedOn:string;notes:string;draft:Record<string,string>;marked:string[];revision:number};
export type SimulationState = { quiz:GuestQuiz & {title:string;premium?:PremiumExamInfo} } | {result:SimulationResult};
const subjects=["matematica","portugues","ciencias","historia","geografia"];
function obj(v:unknown):Record<string,unknown>{if(!v||typeof v!=="object"||Array.isArray(v))throw new Error("invalid_simulation");return v as Record<string,unknown>;}
function title(v:unknown):string{if(typeof v!=="string"||!v.trim()||v.length>100)throw new Error("invalid_simulation");return v;}
function count(v:unknown):number{if(!Number.isInteger(v)||Number(v)<5||Number(v)>100)throw new Error("invalid_simulation");return Number(v);}
export function parseCatalog(v:unknown):Simulation[]{
 if(!Array.isArray(v)||v.length>100)throw new Error("invalid_simulation");
 const items=v.map(v=>{const r=obj(v);if(!isHistoryId(r.id)||(r.subject!==null&&!subjects.includes(String(r.subject))))throw new Error("invalid_simulation");return {id:r.id,title:title(r.title),count:count(r.count),subject:r.subject as string|null};});
 if(new Set(items.map(x=>x.id)).size!==items.length)throw new Error("invalid_simulation");return items;
}
export function parseSimulationResult(v:unknown):SimulationResult{
 const r=obj(v);if(!isHistoryId(r.id)||!Number.isSafeInteger(r.durationSeconds)||Number(r.durationSeconds)<0||Number(r.durationSeconds)>86400)throw new Error("invalid_simulation");
 const result=toQuizResult(v,count(r.total),r.timed===true);
 if(result.questions.some(q=>!isHistoryId(q.id)||!subjects.includes(q.subject)))throw new Error("invalid_simulation");
 return {...result,title:title(r.title),durationSeconds:Number(r.durationSeconds),...(r.timed===true?{timed:true as const}:{})};
}
export function parseSimulationState(v:unknown):SimulationState{
 const r=obj(v);if(r.result)return {result:parseSimulationResult(r.result)};
 const q=obj(r.quiz),quiz=toPublicQuiz(q,count(q.questionCount));
 if(!isHistoryId(quiz.id)||!Number.isFinite(Date.parse(quiz.startedAt))||Date.parse(quiz.expiresAt)<=Date.parse(quiz.startedAt)||new Set(quiz.questions.map(q=>q.id)).size!==quiz.questionCount||quiz.questions.some((q,i)=>q.position!==i+1||!isHistoryId(q.id)||!subjects.includes(q.subject)))throw new Error("invalid_simulation");
 let premium:PremiumExamInfo|undefined;
 if(q.premium!==undefined){const p=obj(q.premium),draft=obj(p.draft),ids=new Set(quiz.questions.map(q=>q.id));
  if(!["realistic","custom"].includes(String(p.mode))||typeof p.institution!=="string"||!Number.isInteger(p.durationMinutes)||Number(p.durationMinutes)<10||Number(p.durationMinutes)>360||!Number.isSafeInteger(p.reusedQuestions)||Number(p.reusedQuestions)<0||Number(p.reusedQuestions)>quiz.questionCount||typeof p.sourceUrl!=="string"||new URL(p.sourceUrl).protocol!=="https:"||typeof p.verifiedOn!=="string"||typeof p.notes!=="string"||!Number.isSafeInteger(p.revision)||Number(p.revision)<0||Object.entries(draft).some(([id,a])=>!ids.has(id)||typeof a!=="string"||!/^[A-E]$/.test(a))||!Array.isArray(p.marked)||p.marked.length>quiz.questionCount||p.marked.some(id=>typeof id!=="string"||!ids.has(id)))throw Error("invalid_simulation");
  premium={mode:p.mode as PremiumExamInfo["mode"],institution:p.institution,durationMinutes:Number(p.durationMinutes),reusedQuestions:Number(p.reusedQuestions),sourceUrl:p.sourceUrl,verifiedOn:p.verifiedOn,notes:p.notes,draft:draft as Record<string,string>,marked:p.marked as string[],revision:Number(p.revision)};
 }
 return {quiz:{...quiz,title:title(q.title),...(premium?{premium}:{})}};
}
export type SimulationInput = {action:"start";id:string}|{action:"submit";id:string;answers:Answers};
export function parseSimulationInput(v:unknown):SimulationInput{
 const r=obj(v);if(!isHistoryId(r.id))throw new Error("invalid_input");
 if(r.action==="start"&&Object.keys(r).length===2)return {action:"start",id:r.id};
 if(r.action!=="submit"||Object.keys(r).length!==3||!Array.isArray(r.answers))throw new Error("invalid_input");
 count(r.answers.length);
 const answers=r.answers.map(v=>{const x=obj(v);if(Object.keys(x).length!==2||!isHistoryId(x.questionId)||typeof x.answer!=="string"||!/^[A-E]$/.test(x.answer))throw new Error("invalid_input");return {questionId:x.questionId,answer:x.answer};});
 if(new Set(answers.map(a=>a.questionId)).size!==answers.length)throw new Error("invalid_input");return {action:"submit",id:r.id,answers};
}
export function durationText(seconds:number){const m=Math.floor(seconds/60),s=seconds%60;return m?`${m} min ${s?`${s} s`:""}`.trim():`${s} s`;}
