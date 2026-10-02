"use client";
import { useEffect,useRef,useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { parseStatistics,subjectNames,subjectPercentage,type StudyStatistics,type Period } from "@/lib/quiz/statistics-contract";
import { demoStatistics } from "./statistics-preview";
import { demoSimulations,previewSimulation,previewCorrection } from "../simulados/simulation-preview";
import Result from "../quiz/result/result";
import type { QuizResult } from "@/lib/quiz/result-contract";
import base from "../quiz/quiz.module.css";
import history from "../historico/history.module.css";
import styles from "./statistics.module.css";
export default function Statistics({initial=null,preview=false,initialPeriod="all"}:{initial?:StudyStatistics|null;preview?:boolean;initialPeriod?:Period}){
 const [period,setPeriod]=useState<Period>(initialPeriod),[data,setData]=useState<StudyStatistics|null>(preview?demoStatistics(initialPeriod):initial);
 const [busy,setBusy]=useState(false),[error,setError]=useState(!preview&&!initial?"Não foi possível carregar as estatísticas.":"");
 const [detail,setDetail]=useState<QuizResult|null>(null);
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>{controller.current?.abort();},[]);
 async function load(next:Period){
  controller.current?.abort();setPeriod(next);setError("");setData(null);
  if(preview){setData(demoStatistics(next));return;}
  const ac=new AbortController();controller.current=ac;setBusy(true);const timer=setTimeout(()=>ac.abort(),15000);
  try{const r=await fetch("/api/statistics?period="+next,{cache:"no-store",credentials:"same-origin",signal:ac.signal});if(!r.ok)throw Error(r.status===401?"Entre novamente para ver suas estatísticas.":"Não foi possível carregar as estatísticas.");const value=parseStatistics(await r.json(),next);if(controller.current===ac&&!ac.signal.aborted)setData(value);}
  catch(e){if(controller.current===ac)setError(ac.signal.aborted?"A consulta demorou demais. Tente novamente.":e instanceof Error&&e.name==="Error"?e.message:"Confira sua conexão e tente novamente.");}
  finally{clearTimeout(timer);if(controller.current===ac)setBusy(false);}
 }
 function openDemo(item:StudyStatistics["recent"][number]){
  const simulation=previewSimulation(demoSimulations.find(s=>s.id===item.id)!);
  if(!("quiz" in simulation))return;
  const result=previewCorrection(simulation,simulation.quiz.questions.map((q,i)=>({questionId:q.id,answer:i<item.score?"B":"D"})));
  if("result" in result){setDetail(result.result);window.scrollTo({top:0,behavior:"instant"});}
 }
 if(detail)return <><div className={history.backRow}><button className={history.backLink} onClick={()=>setDetail(null)}><Image className={history.backIcon} src="/icons/arrow-right.svg" width={20} height={20} alt=""/>Voltar às estatísticas</button></div><Result preview={detail} saved/></>;
 return <div className={base.page}>
  <header className={base.header}><Link className={base.brand} href="/" aria-label="ETEC / IF — início"><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt=""/></span>ETEC / IF</Link></header>
  <main><h1 className={styles.title}>Estatísticas</h1><label className={styles.label} htmlFor="statistics-period">Período</label><select className={styles.select} id="statistics-period" value={period} onChange={e=>void load(e.target.value as Period)}><option value="all">Todo o período</option><option value="30d">Últimos 30 dias</option></select>
  <div role="status" aria-live="polite" aria-busy={busy}>{busy&&<p className={styles.status}>Carregando estatísticas…</p>}{error&&<p className={styles.status}>{error}</p>}</div>
  {error&&<button className={base.back} onClick={()=>void load(period)}>Tentar novamente</button>}
  {data&&data.answered===0?<p className={styles.status}>{period==="all"?"Ainda não há respostas concluídas nesta conta.":"Não há respostas concluídas nos últimos 30 dias."}</p>:data&&<>
   <section className={styles.summary} aria-label="Resumo"><p className={styles.score}>{data.correct.toLocaleString("pt-BR")} de {data.answered.toLocaleString("pt-BR")} acertos</p><p className={styles.muted}>{(data.answered-data.correct).toLocaleString("pt-BR")} {data.answered-data.correct===1?"erro":"erros"} · {data.simulations} {data.simulations===1?"simulado":"simulados"}</p></section>
   <section className={styles.section} aria-labelledby="subject-statistics"><h2 id="subject-statistics">Por matéria</h2><dl className={styles.list}>{data.subjects.map(s=>{const pct=subjectPercentage(s.answered,s.correct);return <div className={styles.row} key={s.subject}><dt>{subjectNames[s.subject]}</dt><dd>{s.correct.toLocaleString("pt-BR")} de {s.answered.toLocaleString("pt-BR")}{pct!==null?` · ${pct}%`:""}</dd></div>;})}</dl></section>
   <section className={styles.section} aria-labelledby="recent-simulations"><h2 id="recent-simulations">Simulados recentes</h2>{data.recent.length===0?<p className={styles.muted}>Ainda não há simulados concluídos neste período.</p>:<ol className={styles.list}>{data.recent.map(item=>{const contents=<><span><strong>{item.title}</strong><time dateTime={item.at}>{new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"short",year:"numeric",timeZone:"America/Sao_Paulo"}).format(new Date(item.at)).replaceAll(" de "," ")}</time></span><span>{item.score} de {item.total} acertos</span></>;return <li key={item.id}>{preview?<button className={styles.recent} onClick={()=>openDemo(item)} aria-label={`Ver resultado de ${item.title}`}>{contents}</button>:<Link className={styles.recent} href={"/historico/simulations/"+item.id} aria-label={`Ver resultado de ${item.title}`}>{contents}</Link>}</li>;})}</ol>}</section>
  </>}
  <div className={styles.back}><Link className={history.backLink} href="/historico"><Image className={history.backIcon} src="/icons/arrow-right.svg" width={20} height={20} alt=""/>Ver histórico</Link></div>
  </main><footer className={styles.footer}>{preview?"Dados ilustrativos.":"Respostas de testes salvos, questões praticadas e simulados concluídos. Novas tentativas contam novamente."}</footer>
 </div>;
}
