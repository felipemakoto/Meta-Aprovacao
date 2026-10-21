"use client";
import {useRef,useState} from "react";
import Link from "next/link";
import {subjects} from "@/lib/quiz/practice-contract";
import {localStudyDate} from "@/lib/premium-study/planning";
import type {Workspace,Session,SessionInput} from "@/lib/premium-study/contract";
import type {Mutate} from "./workspace";
import styles from "./study.module.css";
const kinds:Record<string,string>={practice:"Questões",review:"Revisão",flashcards:"Flashcards",simulation:"Simulado",personal:"Pessoal"};
function input(s:Session):SessionInput{return {title:s.title,date:s.study_date,time:s.start_time.slice(0,5),minutes:s.minutes,subject:s.subject??"",topic:s.topic,kind:s.kind,goal:s.goal,reminder:s.reminder_minutes,completed:!!s.completed_at,archived:s.archived};}
export default function CalendarPanel({data,busy,mutate}:{data:Workspace;busy:boolean;mutate:Mutate}){
 const today=localStudyDate(new Date(data.asOf)),[selected,setSelected]=useState(today),[view,setView]=useState("month"),[institution,setInstitution]=useState(data.profile?.institution??""),[editing,setEditing]=useState<string|null>(null);
 const empty=(date:string):SessionInput=>({title:"",date,time:data.profile?.startTime??"18:00",minutes:30,subject:"",topic:"",kind:"personal",goal:10,reminder:data.profile?.reminder??15,completed:false,archived:false});
 const [form,setForm]=useState<SessionInput>(empty(today)),request=useRef<string|null>(null),formRef=useRef<HTMLFormElement>(null);
 const anchor=new Date(selected+"T12:00:00Z"),start=new Date(anchor);
 if(view==="month")start.setUTCDate(1);start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));
 const dates=Array.from({length:view==="month"?42:7},(_,n)=>new Date(start.getTime()+n*86400000).toISOString().slice(0,10));
 const official=data.officialEvents.filter(e=>!institution||e.institution===institution),sessions=data.sessions.filter(s=>s.study_date===selected);
 function update(patch:Partial<SessionInput>){request.current=null;setForm(f=>({...f,...patch}));}
 async function save(s:Session,patch:Partial<SessionInput>){await mutate({action:"save_session",id:s.id,requestId:crypto.randomUUID(),session:{...input(s),...patch}});}
 function move(direction:number){const d=new Date(anchor);if(view==="month"){d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+direction);}else d.setUTCDate(d.getUTCDate()+7*direction);setSelected(d.toISOString().slice(0,10));}
 return <section>
  <div className={styles.calendarTools}><div className={styles.actions}><button className={styles.secondary} onClick={()=>move(-1)} aria-label="Período anterior">Anterior</button><button className={styles.secondary} onClick={()=>setSelected(today)}>Hoje</button><button className={styles.secondary} onClick={()=>move(1)} aria-label="Próximo período">Próximo</button></div>
   <label>Visualização<select value={view} onChange={e=>setView(e.target.value)}><option value="month">Mensal</option><option value="week">Semanal</option></select></label><label>Datas oficiais<select value={institution} onChange={e=>setInstitution(e.target.value)}><option value="">Todas as instituições</option>{data.institutions.map(i=><option value={i.id} key={i.id}>{i.name}</option>)}</select></label></div>
  <h2>{new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric",timeZone:"UTC"}).format(anchor)}</h2>
  <div className={styles.calendar} aria-label="Escolha um dia">{["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"].map(d=><span className={styles.weekday} key={d}>{d}</span>)}
   {dates.map(date=>{const own=data.sessions.filter(s=>s.study_date===date),events=official.filter(e=>e.event_date===date);return <button key={date} className={`${styles.calendarDay} ${date.slice(0,7)!==selected.slice(0,7)?styles.outside:""}`} aria-pressed={selected===date} aria-label={`${date.split("-").reverse().join("/")}, ${own.length} sessões, ${events.length} eventos oficiais`} onClick={()=>{setSelected(date);if(!editing)update({date});}}><time dateTime={date}>{Number(date.slice(8))}</time>{events.length>0&&<span className={styles.officialBadge}>Of. {events.length}</span>}{own.length>0&&<span className={styles.personalBadge}>Est. {own.length}</span>}</button>;})}
  </div>
  <h2>{selected.split("-").reverse().join("/")}</h2>
  <ul className={styles.rows}>{official.filter(e=>e.event_date===selected).map(e=><li className={styles.officialRow} key={`official-${e.id}`}><div><strong>Data oficial · {e.title}</strong><p>{e.event_time?e.event_time.slice(0,5):"Horário não informado nesta fonte"} · Conferido em {e.verified_on.split("-").reverse().join("/")}</p></div><a href={e.source_url} target="_blank" rel="noopener noreferrer">Fonte oficial</a></li>)}
   {sessions.map(s=><li key={s.id}><div><label className={styles.inlineCheck}><input type="checkbox" disabled={busy} checked={!!s.completed_at} onChange={e=>void save(s,{completed:e.target.checked}).catch(()=>{})}/><strong>{s.title}</strong></label><p>{s.start_time.slice(0,5)} · {s.minutes} min · {kinds[s.kind]} · Meta: {s.goal}{s.topic?` · ${s.topic}`:""}</p><p>{s.source==="plan"?"Gerada pelo plano":"Edição manual"}</p></div><div className={styles.actions}>{s.kind!=="personal"&&<Link className={styles.secondary} href={`/premium/estudos?area=${["practice","simulation"].includes(s.kind)?"custom":s.kind==="review"?"reviews":"flashcards"}&session=${s.id}`}>Estudar</Link>}<button className={styles.secondary} disabled={busy} onClick={()=>{setEditing(s.id);setForm(input(s));request.current=null;formRef.current?.scrollIntoView({behavior:"smooth",block:"start"});}}>Editar</button><button className={styles.secondary} disabled={busy} onClick={()=>{if(window.confirm("Remover esta sessão do calendário?"))void save(s,{archived:true}).catch(()=>{});}}>Remover</button></div></li>)}</ul>
  {!sessions.length&&!official.some(e=>e.event_date===selected)&&<p>Nenhuma atividade neste dia.</p>}
  <form ref={formRef} onSubmit={async e=>{e.preventDefault();request.current??=crypto.randomUUID();try{await mutate({action:"save_session",id:editing,requestId:request.current,session:form});setEditing(null);setForm(empty(selected));request.current=null;}catch{}}}><fieldset className={styles.formGrid} disabled={busy}><legend>{editing?"Editar sessão":"Criar sessão de estudo"}</legend>
   <label>Título<input required maxLength={120} value={form.title} onChange={e=>update({title:e.target.value})}/></label><label>Data<input type="date" required value={form.date} onChange={e=>update({date:e.target.value})}/></label><label>Horário<input type="time" required value={form.time} onChange={e=>update({time:e.target.value})}/></label><label>Duração em minutos<input type="number" min={10} max={360} required value={form.minutes} onChange={e=>update({minutes:Number(e.target.value)})}/></label>
   <label>Atividade<select value={form.kind} onChange={e=>update({kind:e.target.value})}>{Object.entries(kinds).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>Matéria<select value={form.subject} onChange={e=>update({subject:e.target.value,topic:""})}><option value="">Sem matéria específica</option>{Object.entries(subjects).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
   <label>Assunto<select value={form.topic} onChange={e=>update({topic:e.target.value})}><option value="">Todos</option>{data.topics.filter(t=>t.subject===form.subject).map(t=><option key={t.topic}>{t.topic}</option>)}</select></label>
   <label>Meta de questões/cartões<input type="number" min={1} max={100} required value={form.goal} onChange={e=>update({goal:Number(e.target.value)})}/></label><label>Lembrete<select value={form.reminder} onChange={e=>update({reminder:Number(e.target.value)})}>{[0,5,15,30,60].map(n=><option key={n} value={n}>{n?`${n} minutos antes`:"Sem lembrete"}</option>)}</select></label>
   <div className={styles.actions}><button className={styles.primary}>{busy?"Salvando…":"Salvar sessão"}</button>{editing&&<button type="button" className={styles.secondary} onClick={()=>{setEditing(null);setForm(empty(selected));}}>Cancelar edição</button>}</div>
  </fieldset></form>
 </section>;
}
