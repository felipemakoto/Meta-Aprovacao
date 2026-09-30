"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { QuizSession } from "../quiz/quiz";
import Result from "../quiz/result/result";
import { parseSimulationState,durationText,type SimulationState } from "@/lib/quiz/simulation-contract";
import type { Answers } from "@/lib/quiz/result-contract";
import { previewCorrection } from "./simulation-preview";
import base from "../quiz/quiz.module.css";
import styles from "./simulations.module.css";
import historyStyles from "../historico/history.module.css";
export default function SimulationSession({initial,preview=false,onBack,historyView=false}:{initial:SimulationState;preview?:boolean;onBack?:()=>void;historyView?:boolean}){
 const [state,setState]=useState(initial),[expired,setExpired]=useState(false),[login,setLogin]=useState(false);
 async function finish(answers:Answers){
  if(preview){setState(previewCorrection(state,answers));return;}
  if(!("quiz" in state))return;
  const r=await fetch("/api/simulations",{method:"POST",cache:"no-store",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"submit",id:state.quiz.id,answers}),signal:AbortSignal.timeout(15000)});
  if(r.status===401){setLogin(true);throw new Error("login_required");}
  if(r.status===404){setExpired(true);throw new Error("expired");}
  if(r.status===409){const saved=await fetch("/api/simulations?id="+state.quiz.id,{cache:"no-store",credentials:"same-origin",signal:AbortSignal.timeout(15000)});if(saved.ok){const result=parseSimulationState(await saved.json());if("result" in result){setState(result);return;}}}
  if(!r.ok)throw new Error("submission_failed");
  setState(parseSimulationState(await r.json()));
 }
 const back=onBack?<button className={base.back} onClick={onBack}>Voltar aos simulados</button>:<Link className={base.returnLink} href="/simulados">Voltar aos simulados</Link>;
 const historyBack=onBack?<button className={historyStyles.backLink} onClick={onBack}><Image className={historyStyles.backIcon} src="/icons/arrow-right.svg" width={20} height={20} alt=""/>Voltar ao histórico</button>:<Link className={historyStyles.backLink} href="/historico?kind=simulations"><Image src="/icons/arrow-right.svg" width={20} height={20} alt=""/>Voltar ao histórico</Link>;
 if("result" in state){
  const labels:Record<string,string>={matematica:"Matemática",portugues:"Português",ciencias:"Ciências",historia:"História",geografia:"Geografia"};
  const groups=Object.entries(labels).map(([key,label])=>({label,questions:state.result.questions.filter(q=>q.subject===key)})).filter(g=>g.questions.length>=5);
  return <><div className={styles.metadata}>{historyView?historyBack:back}<p>{state.result.title} · Duração: {durationText(state.result.durationSeconds)}{preview?" (exemplo)":""}</p>{!historyView&&historyBack}
  {groups.length>0&&<details className={styles.breakdown}><summary>Por matéria</summary><dl>{groups.map(g=>{const score=g.questions.filter(q=>q.correct).length;return <div key={g.label}><dt>{g.label}</dt><dd>{score} de {g.questions.length} acertos · {Math.round(score/g.questions.length*100)}%</dd></div>;})}</dl></details>}
  </div><Result initialResult={preview?undefined:state.result} preview={preview?state.result:undefined} saved={!preview}/></>;
 }
 if(login)return <main className={base.page}><h1>Entre novamente para concluir</h1><p>Volte a esta tentativa após entrar na mesma conta. O rascunho permanece nesta aba, quando o navegador permite.</p><Link className={base.returnLink} href="/login">Entrar</Link></main>;
 return <div className={base.page}><header className={base.header}><Link href="/" className={base.brand}><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt=""/></span>ETEC / IF</Link>{onBack?<button className={styles.exitControl} onClick={onBack}>Simulados</button>:<Link className={base.exit} href="/simulados">Simulados</Link>}</header><main>
  {expired?<section className={base.message} role="status"><h1>Tentativa indisponível</h1><p>O prazo terminou ou esta tentativa não está disponível.</p>{back}</section>:<><p className={styles.intro}>{state.quiz.title}</p><QuizSession quiz={state.quiz} preview={preview} simulation onExpire={()=>{if(!preview)setExpired(true);}} onFinish={finish}/></>}
 </main>{preview?<p className={styles.footer}>Questões repetidas para demonstração. Dados ilustrativos.</p>:<p className={styles.footer}>Prazo para concluir: 24 horas após iniciar. Respostas em rascunho ficam neste navegador e nesta aba.</p>}</div>;
}
