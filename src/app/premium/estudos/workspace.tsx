"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import StudyShell from "@/app/study-shell";
import {parseWorkspace,studyAreas,type StudyArea,type StudyCommand,type Workspace as WorkspaceData} from "@/lib/premium-study/contract";
import {parseSimulationState} from "@/lib/quiz/simulation-contract";
import {localStudyDate} from "@/lib/premium-study/planning";
import {PlanPanel,ExamPanel} from "./planning-panels";
import CalendarPanel from "./calendar-panel";
import AnalyticsPanel from "./analytics-panel";
import CardsPanel from "./cards-panel";
import LibraryPanel from "./library-panel";
import styles from "./study.module.css";
const messages:Record<string,string>={premium_required:"Seu Premium não está ativo. O Gratuito continua disponível.",login_required:"Entre novamente na sua conta.",invalid_input:"Confira os campos informados.",activity_unavailable:"Essa atividade não está disponível para sua conta.",activity_limit:"O limite de atividades foi atingido.",content_insufficient:"Não há questões validadas suficientes para essa seleção. Reduza a quantidade ou amplie os filtros.",plan_changed:"O plano foi alterado em outra aba. Atualize a página.",review_not_due:"Este cartão já foi revisado. Atualize a lista para ver os próximos.",rate_limited:"Aguarde um minuto antes de iniciar outro simulado.",invalid_document:"Informe dois PDFs diferentes hospedados em fontes oficiais permitidas.",source_links_missing:"A página oficial precisa conter links para os dois PDFs informados.",source_unavailable:"A fonte oficial não respondeu à verificação. Nenhum documento foi cadastrado.",draft_conflict:"O rascunho mudou em outra aba. Reabra a tentativa."};
export async function studyRequest(command:StudyCommand){
 const r=await fetch("/api/premium/study",{method:"POST",cache:"no-store",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(command),signal:AbortSignal.timeout(35000)});
 const body=await r.json();if(!r.ok)throw Error(messages[body.error]??"Não foi possível concluir. Tente novamente.");return body.data;
}
export default function Workspace({initial,area,sessionId}:{initial:WorkspaceData;area:StudyArea;sessionId?:string}){
 const [data,setData]=useState(initial),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState(false),[reminders,setReminders]=useState(false);
 const router=useRouter(),lock=useRef(false);const periodRef=useRef(initial.days);const session=data.sessions.find(s=>s.id===sessionId);
 async function reload(days=periodRef.current){const r=await fetch(`/api/premium/study?days=${days}`,{cache:"no-store",credentials:"same-origin",signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error("Não foi possível atualizar os dados.");const w=parseWorkspace(await r.json());periodRef.current=days;setData(w);}
 useEffect(()=>{
  let active=true;
  studyRequest({action:"sync_plan"}).then(async result=>{if(active&&result?.changed){const r=await fetch("/api/premium/study",{cache:"no-store",signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error();const w=parseWorkspace(await r.json());if(active)setData(w);}})
   .catch(()=>{if(active){setError(true);setNotice("Não foi possível adaptar o cronograma. Seu plano salvo foi preservado. Use Atualizar plano para tentar novamente.");}});
  return()=>{active=false;};
 },[]);
 useEffect(()=>{
  if(!reminders||!("Notification" in window)||Notification.permission!=="granted")return;
  const timers=data.sessions.filter(s=>!s.completed_at&&s.reminder_minutes>0).map(s=>{
   const target=new Date(`${s.study_date}T${s.start_time.slice(0,5)}:00-03:00`).getTime()-s.reminder_minutes*60000,delay=target-Date.now();
   if(delay<0||delay>86400000)return null;return setTimeout(()=>{new Notification("Meta Aprovação",{body:s.title+" · "+s.start_time.slice(0,5),tag:s.id});},delay);
  });return()=>{timers.forEach(t=>{if(t!==null)clearTimeout(t);});};
 },[data.sessions,reminders]);
 async function mutate(command:StudyCommand){
  if(lock.current)return;lock.current=true;setBusy(true);setNotice("");setError(false);
  try{
   const result=await studyRequest(command);
   if(command.action==="start_exam"){const state=parseSimulationState(result);router.push(`/simulados/${"quiz" in state?state.quiz.id:state.result.id}`);return result;}
   if(command.action==="save_profile"||command.action==="rate_card")await studyRequest({action:"sync_plan"});
   await reload();setNotice(command.action==="sync_plan"?"Cronograma atualizado. Edições manuais e atividades concluídas foram preservadas.":"Alteração salva.");return result;
  }catch(e){setError(true);setNotice(e instanceof Error?e.message:"A conexão falhou. Tente novamente.");throw e;}
  finally{lock.current=false;setBusy(false);}
 }
 const today=localStudyDate(new Date(data.asOf)),todaySessions=data.sessions.filter(s=>s.study_date===today),weekStart=new Date(today+"T12:00:00Z");weekStart.setUTCDate(weekStart.getUTCDate()-((weekStart.getUTCDay()+6)%7));
 const week=weekStart.toISOString().slice(0,10),weekEnd=new Date(weekStart.getTime()+7*86400000).toISOString().slice(0,10),weekSessions=data.sessions.filter(s=>s.study_date>=week&&s.study_date<weekEnd);
 return <StudyShell active="premium"><main className={styles.page}>
  <header className={styles.heading}><div><p className={styles.kicker}>Seu espaço Premium</p><h1>{studyAreas[area]}</h1></div><Link className={styles.secondary} href="/premium">Meu plano</Link></header>
  <nav className={styles.areas} aria-label="Recursos Premium">{Object.entries(studyAreas).map(([key,label])=><Link key={key} href={`/premium/estudos?area=${key}`} aria-current={area===key?"page":undefined}>{label}</Link>)}</nav>
  <div role={error?"alert":"status"} aria-live="polite">{notice&&<p className={error?styles.error:styles.notice}>{notice}</p>}</div>
  {area==="plan"&&<><div className={styles.summary}><span>Hoje <strong>{todaySessions.filter(s=>s.completed_at).length}/{todaySessions.length}</strong> sessões concluídas</span><span>Esta semana <strong>{weekSessions.filter(s=>s.completed_at).reduce((n,s)=>n+s.goal,0)}/{data.profile?.weeklyGoal??0}</strong> questões/cartões de meta</span></div><PlanPanel data={data} busy={busy} mutate={mutate}/></>}
  {(area==="realistic"||area==="custom")&&<ExamPanel key={area+sessionId} data={data} mode={area==="realistic"?"realistic":"custom"} busy={busy} mutate={mutate} session={session}/>}
  {(area==="diagnosis"||area==="radar")&&<AnalyticsPanel data={data} radar={area==="radar"} reload={reload}/>}
  {(area==="reviews"||area==="flashcards")&&<CardsPanel key={area+sessionId} data={data} mode={area==="reviews"?"review":"flashcard"} busy={busy} mutate={mutate} session={session}/>}
  {area==="calendar"&&<><div className={styles.actions}><a className={styles.secondary} href="/api/premium/study?view=calendar">Exportar calendário e lembretes (.ics)</a><button className={styles.secondary} onClick={async()=>{if(!("Notification" in window)){setError(true);setNotice("Este navegador não oferece avisos. Exporte o calendário para receber lembretes no celular.");return;}const permission=await Notification.requestPermission();setReminders(permission==="granted");setError(permission!=="granted");setNotice(permission==="granted"?"Avisos ativados enquanto esta aba estiver aberta.":"Avisos não autorizados. Você pode usar os lembretes do calendário exportado.");}}>{reminders?"Avisos desta aba ativados":"Ativar avisos nesta aba"}</button></div><p className={styles.help}>Horários de Brasília. Para receber lembretes com o site fechado, importe o arquivo no calendário do celular ou computador. A importação é uma cópia; exporte novamente após editar o plano.</p><CalendarPanel data={data} busy={busy} mutate={mutate}/></>}
  {area==="library"&&<LibraryPanel data={data} busy={busy} mutate={mutate}/>}
 </main></StudyShell>;
}
export type Mutate=(command:StudyCommand)=>Promise<unknown>;
