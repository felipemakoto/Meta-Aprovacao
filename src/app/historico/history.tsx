"use client";
import { useEffect,useRef,useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { parseHistory,type HistoryKind,type HistoryPage,type HistoryItem } from "@/lib/quiz/history-contract";
import { subjects } from "@/lib/quiz/practice-contract";
import Result from "../quiz/result/result";
import PracticeReview from "./practice-review";
import { demoTests,demoReview,demoResult } from "./history-preview";
import base from "../quiz/quiz.module.css";
import styles from "./history.module.css";
const failureMessage=(error:unknown,more=false)=>error instanceof Error&&error.message==="Entre novamente para ver seu histórico."?error.message:more?"Não foi possível carregar mais registros.":"Não foi possível carregar seu histórico.";
export default function History({preview=false,unavailable=false,initialKind="tests"}:{preview?:boolean;unavailable?:boolean;initialKind?:HistoryKind}){
 const [kind,setKind]=useState<HistoryKind>(initialKind);
 const [page,setPage]=useState<HistoryPage>({items:preview?demoTests.slice(0,2):[],next:preview?demoTests[1]:null});
 const [busy,setBusy]=useState(!preview&&!unavailable),[error,setError]=useState(unavailable?"Não foi possível carregar seu histórico.":""),[retry,setRetry]=useState(0);
 const [detail,setDetail]=useState<HistoryItem|null>(null);
 const controller=useRef<AbortController|null>(null),lock=useRef(false);
 useEffect(()=>{
  if(preview||unavailable)return;
  const ac=new AbortController();controller.current=ac;lock.current=true;
  const timeout=setTimeout(()=>ac.abort(),15000);
  fetch("/api/history?kind="+kind,{cache:"no-store",credentials:"same-origin",signal:ac.signal})
   .then(async r=>{if(!r.ok)throw new Error(r.status===401?"Entre novamente para ver seu histórico.":"Não foi possível carregar seu histórico.");return parseHistory(await r.json(),kind);})
   .then(p=>{if(controller.current===ac && !ac.signal.aborted)setPage(p);})
   .catch(e=>{if(controller.current===ac)setError(ac.signal.aborted?"A consulta demorou demais. Tente novamente.":failureMessage(e));})
   .finally(()=>{clearTimeout(timeout);if(controller.current===ac){lock.current=false;setBusy(false);}});
  return ()=>{controller.current=null;ac.abort();clearTimeout(timeout);};
 },[kind,retry,preview,unavailable]);
 useEffect(()=>()=>{controller.current?.abort();},[]);
 useEffect(()=>{if(preview){window.scrollTo({top:0,behavior:"instant"});if(detail)document.getElementById("practice-review-title")?.focus();}},[preview,detail]);
 async function more(){
  if(lock.current||!page.next)return;
  if(preview){setPage({items:demoTests,next:null});return;}
  const ac=new AbortController();controller.current=ac;lock.current=true;setBusy(true);setError("");
  const timeout=setTimeout(()=>ac.abort(),15000);
  try{const p=new URLSearchParams({kind,before:page.next.at,beforeId:page.next.id});
   const r=await fetch("/api/history?"+p,{cache:"no-store",credentials:"same-origin",signal:ac.signal});
   if(!r.ok)throw new Error(r.status===401?"Entre novamente para ver seu histórico.":"Não foi possível carregar mais registros.");
   const data=parseHistory(await r.json(),kind);
   if(controller.current===ac && !ac.signal.aborted)setPage(old=>({items:[...old.items,...data.items.filter(x=>!old.items.some(y=>y.id===x.id))],next:data.next}));
  }catch(e){if(controller.current===ac)setError(ac.signal.aborted?"A consulta demorou demais. Tente novamente.":failureMessage(e,true));}
  finally{clearTimeout(timeout);if(controller.current===ac){lock.current=false;setBusy(false);}}
 }
 function change(next:HistoryKind){if(next===kind||unavailable)return;controller.current?.abort();controller.current=null;lock.current=false;setDetail(null);setError("");setBusy(!preview);setKind(next);setPage(preview?{items:next==="tests"?demoTests.slice(0,2):[demoReview],next:next==="tests"?demoTests[1]:null}:{items:[],next:null});}
 if(preview&&detail)return <div><div className={styles.backRow}><button className={styles.backLink} onClick={()=>setDetail(null)}><Image className={styles.backIcon} src="/icons/arrow-right.svg" width={20} height={20} alt=""/>Voltar ao histórico</button></div>{kind==="tests"?<Result preview={demoResult(detail)} saved/>:<div className={base.page}><PracticeReview review={demoReview}/><p className={styles.footer}>Exemplo visual · dados ilustrativos.</p></div>}</div>;
 return <div className={base.page}>
 <header className={base.header}><Link href="/" className={base.brand}><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt=""/></span>ETEC / IF</Link><Link href="/dashboard" className={base.exit}>Meus estudos</Link></header>
 <main><h1 className={styles.title}>Histórico</h1>
 <div className={styles.tabs} aria-label="Tipo de atividade"><button disabled={unavailable} aria-pressed={kind==="tests"} onClick={()=>change("tests")}>Testes</button><button disabled={unavailable} aria-pressed={kind==="practice"} onClick={()=>change("practice")}>Questões</button></div>
 <div role="status" aria-live="polite">{busy&&<p className={styles.message}>Carregando registros…</p>}{error&&<p className={styles.message}>{error}</p>}</div>
 {error&&!page.items.length&&<button className={base.back} disabled={busy} onClick={()=>{if(unavailable){window.location.reload();return;}setError("");setBusy(true);setPage({items:[],next:null});setRetry(n=>n+1);}}>Tentar novamente</button>}
 {!busy&&!error&&!page.items.length&&<p className={styles.message}>{kind==="tests"?"Ainda não há testes salvos nesta conta.":"Ainda não há questões respondidas nesta conta."}</p>}
 <ol className={styles.list}>{page.items.map(item=><li key={item.id} className={styles.item}>
 <div className={styles.rowHeading}>
 <p className={styles.label}>{kind==="tests"?"Teste diagnóstico":subjects[item.subject as keyof typeof subjects]??item.subject}</p>
 <time className={styles.date} dateTime={item.at}>{new Intl.DateTimeFormat("pt-BR",{day:"numeric",month:"short",year:"numeric",timeZone:"America/Sao_Paulo"}).format(new Date(item.at)).replaceAll(" de "," ").replace(".","")}</time>
 </div>
 <h2 className={styles.score}>{kind==="tests"?item.score+" de "+item.total+" acertos":item.topic}</h2>
 <div className={styles.rowActions}>
 <p className={styles.message}>{kind==="tests"?(item.total===item.score?"Sem erros":(Number(item.total)-Number(item.score))+" "+(Number(item.total)-Number(item.score)===1?"erro":"erros")):(item.correct?"Acertou":"Errou")}</p>
 {preview?<button className={styles.action} onClick={()=>setDetail(item)}>{kind==="tests"?"Ver resultado":"Ver explicação"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt=""/></button>:<Link className={styles.action} href={"/historico/"+kind+"/"+item.id}>{kind==="tests"?"Ver resultado":"Ver explicação"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt=""/></Link>}
 </div></li>)}</ol>
 {page.next&&<button className={styles.more} disabled={busy} onClick={more}>{busy?"Carregando…":error?"Tentar carregar mais":"Carregar mais"}</button>}
 {!busy&&!error&&page.items.length>0&&!page.next&&<p className={styles.message}>Você chegou ao fim do histórico.</p>}
 <Link className={styles.primary} href="/questoes">Praticar questões</Link>
 </main>{preview&&<footer className={styles.footer}>Dados ilustrativos.</footer>}</div>;
}
