export type HistoryKind = "tests" | "practice" | "simulations";
export type Cursor = { at: string; id: string };
export type HistoryItem = Cursor & { score?: number; total?: number; subject?: string; topic?: string; correct?: boolean; title?:string; durationSeconds?:number };
export type HistoryPage = { items: HistoryItem[]; next: Cursor | null };
export type PracticeReview = Cursor & { subject: string; topic: string; statement: string; options: string[]; answer: string; correctAnswer: string; correct: boolean; explanation: string };
export const isHistoryId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const subjects=["matematica","portugues","ciencias","historia","geografia"];
function obj(v:unknown):Record<string,unknown>{if(!v || typeof v!=="object" || Array.isArray(v))throw new Error("invalid_history");return v as Record<string,unknown>;}
function time(v:unknown):v is string {return typeof v==="string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(v) && Number.isFinite(Date.parse(v));}
export function cursor(v:unknown):Cursor {const c=obj(v);if(!time(c.at)||!isHistoryId(c.id))throw new Error("invalid_history");return {at:c.at,id:c.id};}
export function historyQuery(url:URL):{kind:HistoryKind;before:Cursor|null} {
 const p=url.searchParams;
 if([...p.keys()].some(k=>!["kind","before","beforeId"].includes(k)) || ["kind","before","beforeId"].some(k=>p.getAll(k).length>1))throw new Error("invalid_input");
 const kind=p.get("kind");if(kind!=="tests" && kind!=="practice" && kind!=="simulations")throw new Error("invalid_input");
 const at=p.get("before"),id=p.get("beforeId");
 if((at===null)!==(id===null))throw new Error("invalid_input");
 return {kind, before:at===null?null:cursor({at,id})};
}
export function parseHistory(v:unknown,kind:HistoryKind):HistoryPage {
 const b=obj(v);if(!Array.isArray(b.items)||b.items.length>20)throw new Error("invalid_history");
 const items=b.items.map(v=>{const x=obj(v);const c=cursor(x);
 if(kind==="tests"){if(x.total!==10 || !Number.isInteger(x.score)||Number(x.score)<0||Number(x.score)>10)throw new Error("invalid_history");return {...c,total:10,score:Number(x.score)};}
 if(kind==="simulations"){if(!Number.isInteger(x.total)||Number(x.total)<5||Number(x.total)>100||!Number.isInteger(x.score)||Number(x.score)<0||Number(x.score)>Number(x.total)||typeof x.title!=="string"||!x.title||x.title.length>100||!Number.isSafeInteger(x.durationSeconds)||Number(x.durationSeconds)<0||Number(x.durationSeconds)>86400)throw new Error("invalid_history");return {...c,total:Number(x.total),score:Number(x.score),title:x.title,durationSeconds:Number(x.durationSeconds)};}
 if(typeof x.subject!=="string" || !subjects.includes(x.subject) || typeof x.topic!=="string" || typeof x.correct!=="boolean")throw new Error("invalid_history");
 return {...c,subject:x.subject,topic:x.topic,correct:x.correct};});
 if(new Set(items.map(x=>x.id)).size!==items.length)throw new Error("invalid_history");
 const next=b.next===null?null:cursor(b.next);
 if(next && (items.length!==20 || next.id!==items.at(-1)?.id || next.at!==items.at(-1)?.at))throw new Error("invalid_history");
 return {items,next};
}
export function parsePracticeReview(v:unknown):PracticeReview {
 const x=obj(v),c=cursor(x);
 if(typeof x.subject!=="string" || !subjects.includes(x.subject)||typeof x.topic!=="string"||typeof x.statement!=="string"||!x.statement||!Array.isArray(x.options)||x.options.length!==5||x.options.some(v=>typeof v!=="string"||!v) || typeof x.answer!=="string"||!/^[A-E]$/.test(x.answer)||typeof x.correctAnswer!=="string"||!/^[A-E]$/.test(x.correctAnswer)||x.correct!==(x.answer===x.correctAnswer)||typeof x.explanation!=="string"||!x.explanation)throw new Error("invalid_history");
 return {...c,subject:x.subject,topic:x.topic,statement:x.statement,options:x.options,answer:x.answer,correctAnswer:x.correctAnswer,correct:x.correct as boolean,explanation:x.explanation};
}
