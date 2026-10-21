import type {Group,Session,Workspace} from "./contract.ts";
import {subjects} from "../quiz/practice-contract.ts";
export function diagnosis(groups:Group[]){
 return groups.map(g=>{const enough=g.n>=8,accuracy=g.n?Math.round(g.correct/g.n*100):null;
  // Smoothed errors avoid declaring strength/weakness from one or two questions.
  const priority=(g.n-g.correct+2)/(g.n+4);
  return {...g,accuracy,enough,priority,state:!enough?"Amostra insuficiente":accuracy!<60?"Priorizar":accuracy!>=80?"Bom desempenho":"Em desenvolvimento"};
 }).sort((a,b)=>b.priority-a.priority||a.subject.localeCompare(b.subject)||a.topic.localeCompare(b.topic));
}
export type PlannedSession={key:string;title:string;date:string;time:string;minutes:number;subject:string;topic:string;kind:string;goal:number;reminder:number};
export function localStudyDate(at:Date){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(at);}
export function generatePlan(workspace:Workspace,at=new Date()):PlannedSession[]{
 const p=workspace.profile;if(!p)return [];
 const institution=workspace.institutions.find(x=>x.id===p.institution);if(!institution)throw Error("institution_unavailable");
 const eligible=Object.keys(institution.subjects),ranked=diagnosis(workspace.groups.filter(g=>g.level==="subject"));
 const weights=eligible.map(key=>({subject:key,weight:ranked.find(g=>g.subject===key)?.enough?1+3*ranked.find(g=>g.subject===key)!.priority:1.7,assigned:0}));
 const today=localStudyDate(at),start=new Date(today+"T12:00:00Z"),items:PlannedSession[]=[];
 const weekUsed=new Map<string,number>();
 const manual=workspace.sessions.filter(s=>s.source==="manual"&&!s.archived);
 for(let d=0;d<28;d++){
  const day=new Date(start.getTime()+d*86400000),date=day.toISOString().slice(0,10);
  if(date>p.examDate||!p.weekdays.includes(day.getUTCDay()))continue;
  let minute=Number(p.startTime.slice(0,2))*60+Number(p.startTime.slice(3)),budget=p.minutes,dayUsed=0;
  const slots=Math.min(3,Math.max(1,Math.floor(budget/30)));
  for(let slot=0;slot<slots;slot++){
   weights.sort((a,b)=>a.assigned/a.weight-b.assigned/b.weight||a.subject.localeCompare(b.subject));const target=weights[0];target.assigned++;
   const length=Math.floor(budget/(slots-slot));budget-=length;
   const topic=diagnosis(workspace.groups.filter(g=>g.level==="topic"&&g.subject===target.subject)).find(g=>g.enough&&g.state==="Priorizar")?.topic??"";
   const kind=d%7===6&&slot===0?"simulation":(workspace.due.review>0&&slot===0?"review":slot===1&&d%2===0?"flashcards":"practice");
   const time=String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0");
   const overlaps=manual.some(s=>{const m=Number(s.start_time.slice(0,2))*60+Number(s.start_time.slice(3,5));return s.study_date===date&&m<minute+length&&m+s.minutes>minute;});
   const monday=new Date(day);monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));const week=monday.toISOString().slice(0,10),available=p.weeklyGoal-(weekUsed.get(week)??0);
   const goal=Math.min(available,p.dailyGoal-dayUsed,Math.max(1,Math.min(100,Math.ceil(p.dailyGoal/slots))));
   if(goal>0&&minute+length<=1440&&!overlaps&&!(date===today&&new Date(`${date}T${time}:00-03:00`).getTime()<=at.getTime())){items.push({key:`${date}:${slot}`,title:kind==="simulation"?`Simulado personalizado · ${institution.name}`:`${kind==="review"?"Revisar":kind==="flashcards"?"Flashcards":"Praticar"} ${subjects[target.subject as keyof typeof subjects]}`,date,time,minutes:length,subject:target.subject,topic,kind,goal,reminder:p.reminder});weekUsed.set(week,(weekUsed.get(week)??0)+goal);dayUsed+=goal;}
   minute+=length;
  }
 }
 return items;
}
function escapeIcs(s:string){return s.replace(/\\/g,"\\\\").replace(/[\r\n]+/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");}
export function calendarIcs(sessions:Session[],at=new Date()){
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Meta Aprovacao//Estudos//PT-BR","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
 for(const s of sessions.filter(s=>!s.archived)){
  const start=new Date(`${s.study_date}T${s.start_time.slice(0,5)}:00-03:00`),end=new Date(start.getTime()+s.minutes*60000);
  const stamp=(d:Date)=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
  lines.push("BEGIN:VEVENT",`UID:${s.id}@meta-aprovacao.vercel.app`,`DTSTAMP:${stamp(at)}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(end)}`,`SUMMARY:${escapeIcs(s.title)}`,`DESCRIPTION:${escapeIcs(s.topic||"Sessão de estudo")}`,`STATUS:${s.completed_at?"CONFIRMED":"TENTATIVE"}`);
  if(s.reminder_minutes>0)lines.push("BEGIN:VALARM","ACTION:DISPLAY",`DESCRIPTION:${escapeIcs(s.title)}`,`TRIGGER:-PT${s.reminder_minutes}M`,"END:VALARM");
  lines.push("END:VEVENT");
 }
 lines.push("END:VCALENDAR");return lines.join("\r\n")+"\r\n";
}
