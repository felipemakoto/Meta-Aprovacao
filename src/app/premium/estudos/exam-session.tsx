"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {createExamDraftSaver} from "@/lib/premium-study/exam-draft";
import StudyShell from "@/app/study-shell";
import Result from "@/app/quiz/result/result";
import {parseSimulationState,durationText,type SimulationState} from "@/lib/quiz/simulation-contract";
import {subjects} from "@/lib/quiz/practice-contract";
import {studyRequest} from "./workspace";
import base from "@/app/quiz/quiz.module.css";
import styles from "./study.module.css";
export default function PremiumExamSession({initial}:{initial:Extract<SimulationState,{quiz:unknown}>}){
 const quiz=initial.quiz,info=quiz.premium!;
 const [state,setState]=useState<SimulationState>(initial),[index,setIndex]=useState(0),[answers,setAnswers]=useState(info.draft),[marked,setMarked]=useState(info.marked),[remaining,setRemaining]=useState<number|null>(null),[saving,setSaving]=useState("Rascunho recuperado"),[error,setError]=useState(""),[submitting,setSubmitting]=useState(false),[confirm,setConfirm]=useState(false),[conflict,setConflict]=useState(false);
 const mounted=useRef(true),locked=useRef(false),deadlineRequested=useRef(false),submitRef=useRef<()=>void>(()=>{}),heading=useRef<HTMLHeadingElement>(null),finished=useRef(false);
 const question=quiz.questions[index],complete=Object.keys(answers).length;
 useEffect(()=>{const tick=()=>{const n=Math.max(0,Math.ceil((Date.parse(quiz.expiresAt)-Date.now())/1000));setRemaining(n);if(n===0&&!finished.current&&!deadlineRequested.current){deadlineRequested.current=true;submitRef.current();}};const timer=setInterval(tick,1000);return()=>clearInterval(timer);},[quiz.expiresAt]);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[index,confirm]);
 const draft=useRef<ReturnType<typeof createExamDraftSaver>|null>(null);
 useEffect(()=>{
  mounted.current=true;
  draft.current??=createExamDraftSaver(info.revision,snapshot=>studyRequest({action:"save_exam",id:quiz.id,...snapshot}),status=>{
  if(!mounted.current||finished.current)return;
  if(status.state==="saved"){setSaving("Rascunho salvo no servidor");setError("");}
  else if(status.state==="saving")setSaving("Salvando rascunho…");
  else{setSaving("Rascunho ainda não confirmado");setError(status.error instanceof Error?status.error.message:"Não foi possível salvar o rascunho.");if(status.error instanceof Error&&status.error.message.includes("outra aba"))setConflict(true);}
 });
  const warn=(event:BeforeUnloadEvent)=>{if(draft.current?.pending&&!finished.current){event.preventDefault();event.returnValue="";}};
  window.addEventListener("beforeunload",warn);
  return()=>{mounted.current=false;window.removeEventListener("beforeunload",warn);};
 },[quiz.id,info.revision]);
 function persist(nextAnswers:Record<string,string>,nextMarked:string[]){setError("");draft.current?.save({answers:nextAnswers,marked:nextMarked});}
 async function finish(){
  if(locked.current||finished.current)return;locked.current=true;setSubmitting(true);setError("");
  try{const response=await studyRequest({action:"finish_exam",id:quiz.id,answers:quiz.questions.map(q=>({questionId:q.id,answer:answers[q.id]??"-"}))});const parsed=parseSimulationState(response);if(!("result" in parsed))throw Error("Resultado indisponível.");finished.current=true;setState(parsed);}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível corrigir. Tente novamente.");}
  finally{locked.current=false;setSubmitting(false);}
 }
 useEffect(()=>{submitRef.current=()=>{void finish();};});
 function choose(letter:string){if(remaining===null||remaining<=0||submitting||conflict)return;const next={...answers,[question.id]:letter};setAnswers(next);persist(next,marked);}
 function toggle(){if(remaining===null||remaining<=0||submitting||conflict)return;const next=marked.includes(question.id)?marked.filter(id=>id!==question.id):[...marked,question.id];setMarked(next);persist(answers,next);}
 if("result" in state)return <Result initialResult={state.result} saved beforeContent={<div className={styles.page}><Link href="/premium/estudos?area=realistic">Voltar aos estudos Premium</Link><h2>{state.result.title}</h2><p>Duração: {durationText(state.result.durationSeconds)} · {state.result.questions.filter(q=>q.answer==="-").length} não respondidas</p><p>Resultado integrado ao histórico, às estatísticas, ao diagnóstico e às prioridades do plano.</p></div>}/>;
 return <div onClickCapture={event=>{const link=(event.target as Element).closest("a[href]");if(link&&!link.getAttribute("href")?.startsWith("#")&&draft.current?.pending&&!finished.current){event.preventDefault();event.stopPropagation();setSaving("Aguarde a confirmação do rascunho antes de sair");}}}><StudyShell active="premium" focus exit={<Link href="/premium/estudos?area=realistic">Meus simulados</Link>}><main className={styles.page}>
  <h1 ref={heading} tabIndex={-1}>{quiz.title}</h1><div className={styles.examTools}><span className={styles.timer} role="timer" aria-label="Tempo restante">{remaining===null?"Sincronizando…":`${Math.floor(remaining/3600)>0?`${Math.floor(remaining/3600)}:`:""}${String(Math.floor(remaining/60)%60).padStart(2,"0")}:${String(remaining%60).padStart(2,"0")}`}</span><span>{complete}/{quiz.questionCount} respondidas · {marked.length} para revisar</span><button className={styles.primary} disabled={submitting||conflict} onClick={()=>setConfirm(true)}>Finalizar</button></div>
  <p className={styles.help}>{saving}. Ao encerrar o prazo, o servidor usa o último rascunho confirmado. {info.reusedQuestions>0?`${info.reusedQuestions} questões já vistas foram reutilizadas para completar esta seleção; não há duplicatas nesta tentativa.`:"Esta seleção priorizou questões ainda não vistas."}</p>
  {error&&<p className={styles.error} role="alert">{error}{conflict?<button className={styles.secondary} onClick={()=>window.location.reload()}>Reabrir tentativa</button>:<button className={styles.secondary} disabled={submitting} onClick={()=>remaining===0?void finish():draft.current?.retry()}>Tentar novamente</button>}</p>}
  {submitting?<p role="status">Corrigindo e salvando resultado…</p>:remaining===0?<section role="status"><h2>Tempo encerrado</h2><p>Estamos recuperando a correção do rascunho salvo.</p><button className={styles.primary} onClick={()=>void finish()}>Consultar resultado</button></section>:<>
   <nav className={styles.examNav} aria-label="Navegação das questões">{quiz.questions.map((q,i)=><button key={q.id} data-marked={marked.includes(q.id)} data-answered={!!answers[q.id]} aria-pressed={index===i} aria-label={`Questão ${i+1}, ${answers[q.id]?"respondida":"em branco"}${marked.includes(q.id)?", marcada para revisão":""}`} onClick={()=>{setIndex(i);setConfirm(false);}}>{i+1}{marked.includes(q.id)?" ·":""}</button>)}</nav>
   {confirm?<section><h2>Pronto para entregar?</h2><p>{quiz.questionCount-complete} questões em branco contarão como erro. Há {marked.length} marcações para revisão.</p><div className={styles.actions}><button className={styles.primary} disabled={conflict} onClick={()=>void finish()}>Entregar e corrigir</button><button className={styles.secondary} onClick={()=>setConfirm(false)}>Continuar respondendo</button></div></section>:<section><p>Questão {index+1} · {subjects[question.subject as keyof typeof subjects]} · {question.topic}</p><h2 className={base.question}>{question.statement}</h2><fieldset className={base.options} disabled={submitting||conflict||remaining===null}><legend className={base.srOnly}>Escolha uma alternativa</legend>{question.options.map((option,i)=><label className={base.option} key={i}><input type="radio" name={question.id} value={"ABCDE"[i]} checked={answers[question.id]==="ABCDE"[i]} onChange={()=>choose("ABCDE"[i])}/><span className={base.letter}>{"ABCDE"[i]}</span><span>{option}</span></label>)}</fieldset><div className={styles.actions}><button className={styles.secondary} disabled={conflict} aria-pressed={marked.includes(question.id)} onClick={toggle}>{marked.includes(question.id)?"Remover marcação":"Marcar para revisar"}</button>{answers[question.id]&&<button className={styles.secondary} disabled={conflict} onClick={()=>{const next={...answers};delete next[question.id];setAnswers(next);persist(next,marked);}}>Deixar em branco</button>}<button className={styles.secondary} disabled={index===0} onClick={()=>setIndex(n=>n-1)}>Anterior</button><button className={styles.primary} onClick={()=>index<quiz.questionCount-1?setIndex(n=>n+1):setConfirm(true)}>{index<quiz.questionCount-1?"Próxima":"Conferir entrega"}</button></div></section>}
  </>}
 </main></StudyShell></div>;
}
