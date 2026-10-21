import {subjects} from "../quiz/practice-contract.ts";
export const studyAreas={plan:"Plano de estudos",realistic:"Simulado realista",reviews:"Revisão e flashcards",diagnosis:"Diagnóstico",custom:"Simulados personalizados",radar:"Radar de conhecimentos",calendar:"Calendário",library:"Provas anteriores"} as const;
export type StudyArea=keyof typeof studyAreas;
export type ReviewCollection="errors"|"all";
export function resolveStudyView(area:unknown,collection:unknown):{area:StudyArea;collection:ReviewCollection}{
 return {area:area==="flashcards"?"reviews":typeof area==="string"&&Object.hasOwn(studyAreas,area)?area as StudyArea:"plan",collection:area==="flashcards"||collection==="all"?"all":"errors"};
}
export function studySessionHref(session:Pick<Session,"id"|"kind">){
 const query=new URLSearchParams({area:session.kind==="review"||session.kind==="flashcards"?"reviews":"custom",session:session.id});
 if(session.kind==="review"||session.kind==="flashcards")query.set("collection",session.kind==="flashcards"?"all":"errors");
 return "/premium/estudos?"+query;
}
export type Group={level:"subject"|"topic"|"difficulty";subject:string;topic:string;difficulty:string;n:number;correct:number};
export type Institution={id:string;name:string;selection:string;question_count:number;duration_minutes:number;subjects:Record<string,number>;fixed_distribution:boolean;source_url:string;verified_on:string;notes:string};
export type Profile={institution:string;examDate:string;weekdays:number[];minutes:number;startTime:string;dailyGoal:number;weeklyGoal:number;reminder:number;version?:string;fingerprint?:string|null};
export type Session={id:string;title:string;study_date:string;start_time:string;minutes:number;subject:string|null;topic:string;kind:string;goal:number;reminder_minutes:number;completed_at:string|null;source:string;plan_key:string|null;archived:boolean};
export type StudyDocument={id:string;institution:string;year:number;selection:string;exam_url:string;answer_url:string;source_url:string;verified_on:string};
export type Card={id:string;subject:string;topic:string;statement:string;answer:string;explanation:string;options:string[];due_at:string|null;interval_days:number|null;errors:number};
export type Workspace={asOf:string;days:number;groups:Group[];institutions:Institution[];officialEvents:{id:number;institution:string;title:string;event_date:string;event_time:string|null;kind:string;source_url:string;verified_on:string}[];profile:Profile|null;sessions:Session[];documents:StudyDocument[];reviewHistory:{id:string;question_id:string;mode:string;rating:number;reviewed_at:string;due_at:string}[];due:{review:number;flashcard:number};topics:{subject:string;topic:string}[];exams:{id:string;title:string;started_at:string;expires_at:string;completed_at:string|null}[]};
export type ExamConfig={mode:"realistic"|"custom";institution:string;subjects:string[];topics:string[];difficulty:string;count:number;minutes:number};
export type SessionInput={title:string;date:string;time:string;minutes:number;subject:string;topic:string;kind:string;goal:number;reminder:number;completed:boolean;archived:boolean};
export type StudyCommand=
 |{action:"save_profile";profile:Profile}
 |{action:"sync_plan"}
 |{action:"save_session";id:string|null;requestId:string;session:SessionInput}
 |{action:"start_exam";config:ExamConfig;requestId:string}
 |{action:"save_exam";id:string;answers:Record<string,string>;marked:string[];revision:number}
 |{action:"finish_exam";id:string;answers:{questionId:string;answer:string}[]}
 |{action:"rate_card";questionId:string;mode:"review"|"flashcard";rating:number;requestId:string}
 |{action:"register_document";document:{institution:string;year:number;selection:string;examUrl:string;answerUrl:string;sourceUrl:string}};
export function object(v:unknown):Record<string,unknown>{if(!v||typeof v!=="object"||Array.isArray(v))throw Error("invalid_input");return v as Record<string,unknown>;}
function exact(r:Record<string,unknown>,keys:string[]){if(Object.keys(r).sort().join()!==keys.sort().join())throw Error("invalid_input");}
function text(v:unknown,max=160){if(typeof v!=="string"||v.length>max||/[\u0000-\u001f]/.test(v))throw Error("invalid_input");return v;}
function integer(v:unknown,min:number,max:number){if(typeof v!=="number"||!Number.isSafeInteger(v)||v<min||v>max)throw Error("invalid_input");return v;}
export function uuid(v:unknown):string{const s=text(v,36);if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(s))throw Error("invalid_input");return s;}
export function dateOnly(v:unknown){const s=text(v,10);if(!/^\d{4}-\d\d-\d\d$/.test(s)||!Number.isFinite(Date.parse(s+"T12:00:00Z"))||new Date(s+"T12:00:00Z").toISOString().slice(0,10)!==s)throw Error("invalid_input");return s;}
function time(v:unknown){const s=text(v,5);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))throw Error("invalid_input");return s;}
function arrayText(v:unknown,max:number){if(!Array.isArray(v)||v.length>max)throw Error("invalid_input");const a=v.map(x=>text(x));if(new Set(a).size!==a.length)throw Error("invalid_input");return a;}
function subject(v:unknown,empty=false){const s=text(v);if(!Object.hasOwn(subjects,s)&&!(empty&&s===""))throw Error("invalid_input");return s;}
function institution(v:unknown){const s=text(v,41);if(!/^[a-z][a-z0-9-]{1,40}$/.test(s))throw Error("invalid_input");return s;}
export function parseStudyCommand(v:unknown):StudyCommand{
 const b=object(v),action=text(b.action,30);const id=()=>uuid(b.id),requestId=()=>uuid(b.requestId);
 if(action==="sync_plan"){exact(b,["action"]);return {action};}
 if(action==="save_profile"){
  exact(b,["action","profile"]);const p=object(b.profile);exact(p,["institution","examDate","weekdays","minutes","startTime","dailyGoal","weeklyGoal","reminder"]);
  if(!Array.isArray(p.weekdays)||!p.weekdays.length||p.weekdays.length>7)throw Error("invalid_input");
  const weekdays=p.weekdays.map(v=>integer(v,0,6));if(new Set(weekdays).size!==weekdays.length)throw Error("invalid_input");
  const reminder=integer(p.reminder,0,60);if(![0,5,15,30,60].includes(reminder))throw Error("invalid_input");
  return {action,profile:{institution:institution(p.institution),examDate:dateOnly(p.examDate),weekdays,minutes:integer(p.minutes,15,240),startTime:time(p.startTime),dailyGoal:integer(p.dailyGoal,1,100),weeklyGoal:integer(p.weeklyGoal,1,700),reminder}};
 }
 if(action==="save_session"){
  exact(b,["action","id","requestId","session"]);const s=object(b.session);exact(s,["title","date","time","minutes","subject","topic","kind","goal","reminder","completed","archived"]);
  const title=text(s.title,120).trim(),kind=text(s.kind),reminder=integer(s.reminder,0,60);
  if(!title||!["practice","review","flashcards","simulation","personal"].includes(kind)||![0,5,15,30,60].includes(reminder)||typeof s.completed!=="boolean"||typeof s.archived!=="boolean")throw Error("invalid_input");
  return {action,id:b.id===null?null:id(),requestId:requestId(),session:{title,date:dateOnly(s.date),time:time(s.time),minutes:integer(s.minutes,10,360),subject:subject(s.subject,true),topic:text(s.topic),kind,goal:integer(s.goal,1,100),reminder,completed:s.completed,archived:s.archived}};
 }
 if(action==="start_exam"){
  exact(b,["action","config","requestId"]);const c=object(b.config);exact(c,["mode","institution","subjects","topics","difficulty","count","minutes"]);
  if(!["realistic","custom"].includes(String(c.mode))||!["all","easy","medium","hard"].includes(String(c.difficulty)))throw Error("invalid_input");
  const selected=arrayText(c.subjects,5).map(v=>subject(v));if(!selected.length)throw Error("invalid_input");
  return {action,requestId:requestId(),config:{mode:c.mode as ExamConfig["mode"],institution:institution(c.institution),subjects:selected,topics:arrayText(c.topics,30),difficulty:String(c.difficulty),count:integer(c.count,5,100),minutes:integer(c.minutes,10,360)}};
 }
 if(action==="save_exam"){
  exact(b,["action","id","answers","marked","revision"]);const a=object(b.answers);if(Object.keys(a).length>100)throw Error("invalid_input");
  const answers:Record<string,string>={};for(const [key,value] of Object.entries(a)){uuid(key);if(typeof value!=="string"||!/[A-E]/.test(value)||value.length!==1)throw Error("invalid_input");answers[key]=value;}
  return {action,id:id(),answers,marked:arrayText(b.marked,100).map(uuid),revision:integer(b.revision,1,1_000_000_000)};
 }
 if(action==="finish_exam"){
  exact(b,["action","id","answers"]);if(!Array.isArray(b.answers)||b.answers.length>100)throw Error("invalid_input");
  const answers=b.answers.map(v=>{const x=object(v);exact(x,["questionId","answer"]);if(typeof x.answer!=="string"||! /^[A-E-]$/.test(x.answer))throw Error("invalid_input");return {questionId:uuid(x.questionId),answer:x.answer};});
  if(new Set(answers.map(x=>x.questionId)).size!==answers.length)throw Error("invalid_input");return {action,id:id(),answers};
 }
 if(action==="rate_card"){
  exact(b,["action","questionId","mode","rating","requestId"]);if(b.mode!=="review"&&b.mode!=="flashcard")throw Error("invalid_input");
  return {action,questionId:uuid(b.questionId),mode:b.mode,rating:integer(b.rating,1,4),requestId:requestId()};
 }
 if(action==="register_document"){
  exact(b,["action","document"]);const d=object(b.document);exact(d,["institution","year","selection","examUrl","answerUrl","sourceUrl"]);
  const selection=text(d.selection,120).trim();if(!selection)throw Error("invalid_input");
  return {action,document:{institution:institution(d.institution),year:integer(d.year,2000,2100),selection,examUrl:text(d.examUrl,1500),answerUrl:text(d.answerUrl,1500),sourceUrl:text(d.sourceUrl,1500)}};
 }
 throw Error("invalid_input");
}
export function parseWorkspace(v:unknown):Workspace{
 const w=object(v);for(const key of ["groups","institutions","officialEvents","sessions","documents","reviewHistory","topics","exams"])if(!Array.isArray(w[key])||w[key].length>2000)throw Error("invalid_data");
 if(typeof w.asOf!=="string"||!Number.isFinite(Date.parse(w.asOf))||![0,7,30,90].includes(Number(w.days)))throw Error("invalid_data");
 for(const row of w.groups as unknown[]){const g=object(row);if(!["subject","topic","difficulty"].includes(String(g.level)))throw Error("invalid_data");subject(g.subject);integer(g.n,0,10_000_000);integer(g.correct,0,Number(g.n));}
 return {asOf:w.asOf,days:Number(w.days),groups:w.groups,institutions:w.institutions,officialEvents:w.officialEvents,profile:w.profile,sessions:w.sessions,documents:w.documents,reviewHistory:w.reviewHistory,due:w.due,topics:w.topics,exams:w.exams} as Workspace;
}
