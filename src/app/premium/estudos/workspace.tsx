"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import StudyShell from "@/app/study-shell";
import {parseWorkspace,studyAreas,type StudyArea,type ReviewCollection,type StudyCommand,type Workspace as WorkspaceData} from "@/lib/premium-study/contract";
import {parseSimulationState} from "@/lib/quiz/simulation-contract";
import {localStudyDate} from "@/lib/premium-study/planning";
import {PlanPanel,ExamPanel} from "./planning-panels";
import CalendarPanel from "./calendar-panel";
import AnalyticsPanel from "./analytics-panel";
import CardsPanel from "./cards-panel";
import LibraryPanel from "./library-panel";
import styles from "./study.module.css";
import {useDailyLimits} from "@/lib/quiz/use-daily-limits";
import {devicePreferences,preferenceEvent} from "@/lib/account/settings-device";
import {sessionReminderAllowed} from "@/lib/account/reminders";
const messages:Record<string,string>={premium_required:"Seu Premium não está ativo. O Gratuito continua disponível.",login_required:"Entre novamente na sua conta.",invalid_input:"Confira os campos informados.",activity_unavailable:"Essa atividade não está disponível para sua conta.",activity_limit:"O limite de atividades foi atingido.",content_insufficient:"Não há questões validadas suficientes para essa seleção. Reduza a quantidade ou amplie os filtros.",plan_changed:"O plano foi alterado em outra aba. Atualize a página.",review_not_due:"Este cartão já foi revisado. Atualize a lista para ver os próximos.",rate_limited:"Muitas solicitações. Aguarde alguns minutos e tente novamente.",invalid_document:"Informe dois PDFs diferentes hospedados em fontes oficiais permitidas.",source_links_missing:"A página oficial precisa conter links para os dois PDFs informados.",source_unavailable:"A fonte oficial não respondeu à verificação. Nenhum documento foi cadastrado.",draft_conflict:"O rascunho mudou em outra aba. Reabra a tentativa."};
export async function studyRequest(command:StudyCommand){
 const r=await fetch("/api/premium/study",{method:"POST",cache:"no-store",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify(command),signal:AbortSignal.timeout(35000),keepalive:command.action==="save_exam"});
 const body=await r.json();if(!r.ok)throw Error(messages[body.error]??"Não foi possível concluir. Tente novamente.");return body.data;
}
const areaDescriptions:Record<StudyArea,string>={
  plan:"Cronograma adaptado à sua rotina e metas",
  realistic:"Provas completas no formato oficial",
  reviews:"Cartões e revisão espaçada dos seus erros",
  diagnosis:"Pontos fortes e matérias para reforçar",
  custom:"Monte treinos por matéria e dificuldade",
  radar:"Mapa visual de desempenho por disciplina",
  calendar:"Datas oficiais e sessões agendadas",
  library:"Editais e provas anteriores oficiais",
};
function AreaIcon({name}:{name:StudyArea}){
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name==="plan"&&<><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></>}
    {name==="realistic"&&<><circle cx="12" cy="14" r="8"/><path d="M9 2h6m-3 0v4m6 0 2-2m-8 6v5l3 2"/></>}
    {name==="reviews"&&<><rect x="3" y="5" width="14" height="14" rx="2"/><path d="M7 3h11a2 2 0 0 1 2 2v11"/></>}
    {name==="diagnosis"&&<path d="M4 20V4m0 16h17M8 16v-5m5 5V7m5 9V3"/>}
    {name==="custom"&&<><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6"/></>}
    {name==="radar"&&<><polygon points="12 2 21 8.5 17.5 19.5 6.5 19.5 3 8.5"/><circle cx="12" cy="12" r="2"/></>}
    {name==="calendar"&&<><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>}
    {name==="library"&&<><path d="M12 5C8 3 5 3 2 4v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-6-1-10 1ZM12 5v16"/></>}
  </svg>;
}
export default function Workspace({initial,area,collection="errors",sessionId,hasExplicitArea=false}:{initial:WorkspaceData;area:StudyArea;collection?:ReviewCollection;sessionId?:string;hasExplicitArea?:boolean}){
 const [data,setData]=useState(initial),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState(false),[reminders,setReminders]=useState(false),[mobileOpen,setMobileOpen]=useState(hasExplicitArea);
 const [reminderPreferences,setReminderPreferences]=useState(devicePreferences());
 useEffect(()=>{const update=()=>{setReminderPreferences(devicePreferences());if("Notification" in window&&Notification.permission==="granted")setReminders(true);};update();window.addEventListener(preferenceEvent,update);return()=>window.removeEventListener(preferenceEvent,update);},[]);
 const router=useRouter(),lock=useRef(false);
 const quota=useDailyLimits(false,false);
 useEffect(()=>{if(quota.limits?.hasPremium===false)router.refresh();},[quota.limits?.hasPremium,router]); const periodRef=useRef(initial.days);const session=data.sessions.find(s=>s.id===sessionId);
 const mobileRoute = JSON.stringify([area, sessionId, hasExplicitArea]);
 const [previousMobileRoute, setPreviousMobileRoute] = useState(mobileRoute);
 if (previousMobileRoute !== mobileRoute) {
  setPreviousMobileRoute(mobileRoute);
  setMobileOpen(hasExplicitArea);
 }
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
   if(delay<0||delay>86400000||(reminderPreferences&&!sessionReminderAllowed(s.kind,new Date(target),reminderPreferences)))return null;return setTimeout(()=>{new Notification("Meta Aprovação",{body:s.title+" · "+s.start_time.slice(0,5),tag:s.id});},delay);
  });return()=>{timers.forEach(t=>{if(t!==null)clearTimeout(t);});};
 },[data.sessions,reminders,reminderPreferences]);
 async function mutate(command:StudyCommand){
  if(lock.current)return;lock.current=true;setBusy(true);setNotice("");setError(false);
  try{
   const result=await studyRequest(command);
   if(command.action==="start_exam"){const state=parseSimulationState(result);router.push(`/simulados/${"quiz" in state?state.quiz.id:state.result.id}`);return result;}
   if(command.action==="save_profile"||command.action==="save_session"||command.action==="rate_card")await studyRequest({action:"sync_plan"});
   await reload();if(command.action!=="rate_card")setNotice(command.action==="sync_plan"?"Cronograma atualizado. Edições manuais e atividades concluídas foram preservadas.":"Alteração salva.");return result;
  }catch(e){if(command.action!=="rate_card"){setError(true);setNotice(e instanceof Error?e.message:"A conexão falhou. Tente novamente.");}throw e;}
  finally{lock.current=false;setBusy(false);}
 }
 const today=localStudyDate(new Date(data.asOf)),todaySessions=data.sessions.filter(s=>s.study_date===today),weekStart=new Date(today+"T12:00:00Z");weekStart.setUTCDate(weekStart.getUTCDate()-((weekStart.getUTCDay()+6)%7));
 const week=weekStart.toISOString().slice(0,10),weekEnd=new Date(weekStart.getTime()+7*86400000).toISOString().slice(0,10),weekSessions=data.sessions.filter(s=>s.study_date>=week&&s.study_date<weekEnd);
 return <StudyShell active="premium"><main className={styles.page} data-mobile-view={mobileOpen?"detail":"list"}>
  {mobileOpen&&<button type="button" className={styles.mobileBack} onClick={()=>setMobileOpen(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>Recursos Premium</button>}
  <header className={`${styles.heading} ${styles.workspaceHeading}`}><div><p className={styles.kicker}>Seu espaço Premium</p><h1>{mobileOpen?studyAreas[area]:"Recursos Premium"}</h1></div><Link className={styles.planLink} href="/premium">Meu plano</Link></header>
  <nav className={styles.mobileResourceList} aria-label="Recursos Premium">{Object.entries(studyAreas).map(([key,label])=>{const k=key as StudyArea;return <Link key={key} href={`/premium/estudos?area=${key}`} className={styles.mobileResourceItem} onClick={()=>setMobileOpen(true)}><span className={styles.mobileResourceIcon}><AreaIcon name={k}/></span><span className={styles.mobileResourceText}><strong>{label}</strong><span>{areaDescriptions[k]}</span></span><span className={styles.mobileResourceChevron} aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg></span></Link>;})}</nav>
  <nav className={styles.areas} aria-label="Recursos Premium">{Object.entries(studyAreas).map(([key,label])=><Link key={key} href={`/premium/estudos?area=${key}`} aria-current={area===key?"page":undefined}>{label}</Link>)}</nav>
  <div className={styles.resourceBody}>
  <div role={error?"alert":"status"} aria-live="polite">{notice&&<p className={error?styles.error:styles.notice}>{notice}</p>}</div>
  {area==="plan"&&<><div className={styles.summary}><span>Hoje <strong>{todaySessions.filter(s=>s.completed_at).length}/{todaySessions.length}</strong> sessões concluídas</span><span>Esta semana <strong>{weekSessions.filter(s=>s.completed_at).reduce((n,s)=>n+s.goal,0)}/{data.profile?.weeklyGoal??0}</strong> questões/cartões de meta</span></div><PlanPanel data={data} busy={busy} mutate={mutate}/></>}
  {(area==="realistic"||area==="custom")&&<ExamPanel key={area+sessionId} data={data} mode={area==="realistic"?"realistic":"custom"} busy={busy} mutate={mutate} session={session}/>}
  {(area==="diagnosis"||area==="radar")&&<AnalyticsPanel data={data} radar={area==="radar"} reload={reload}/>}
  {area==="reviews"&&<CardsPanel key={collection+sessionId} data={data} mode={collection==="all"?"flashcard":"review"} busy={busy} mutate={mutate} session={session}/>}
  {area==="calendar"&&<><div className={styles.actions}><a className={styles.secondary} href="/api/premium/study?view=calendar">Exportar calendário e lembretes (.ics)</a><button className={styles.secondary} onClick={async()=>{if(!("Notification" in window)){setError(true);setNotice("Este navegador não oferece avisos. Exporte o calendário para receber lembretes no celular.");return;}const permission=await Notification.requestPermission();setReminders(permission==="granted");setError(permission!=="granted");setNotice(permission==="granted"?"Avisos ativados enquanto esta aba estiver aberta.":"Avisos não autorizados. Você pode usar os lembretes do calendário exportado.");}}>{reminders?"Avisos desta aba ativados":"Ativar avisos nesta aba"}</button></div><p className={styles.help}>Horários de Brasília. Para receber lembretes com o site fechado, importe o arquivo no calendário do celular ou computador. A importação é uma cópia; exporte novamente após editar o plano.</p><CalendarPanel data={data} busy={busy} mutate={mutate}/></>}
  {area==="library"&&<LibraryPanel data={data} busy={busy} mutate={mutate}/>}
  </div>
 </main></StudyShell>;
}
export type Mutate=(command:StudyCommand)=>Promise<unknown>;
