"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {subjects} from "@/lib/quiz/practice-contract";
import type {Card,Workspace,Session} from "@/lib/premium-study/contract";
import type {Mutate} from "./workspace";
import styles from "./study.module.css";
export default function CardsPanel({data,mode,busy,mutate,session}:{data:Workspace;mode:"review"|"flashcard";busy:boolean;mutate:Mutate;session?:Session}){
 const [subject,setSubject]=useState(session?.subject??""),[topic,setTopic]=useState(session?.topic??""),[cards,setCards]=useState<Card[]>([]),[flipped,setFlipped]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(""),[retry,setRetry]=useState(0),[nextDue,setNextDue]=useState("");
 const pending=useRef<{id:string;rating:number}|null>(null),cardRef=useRef<HTMLButtonElement>(null),card=cards[0];const [pendingRating,setPendingRating]=useState<number|null>(null);
 useEffect(()=>{const controller=new AbortController();let active=true;
  const timeout=setTimeout(()=>controller.abort(),20000);
  fetch(`/api/premium/study?view=cards&mode=${mode}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`,{cache:"no-store",credentials:"same-origin",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error();return r.json();}).then(body=>{if(!Array.isArray(body.cards))throw Error();if(active){setCards(body.cards);setError("");}})
   .catch(()=>{if(active)setError("Não foi possível carregar os cartões. Tente novamente.");}).finally(()=>{clearTimeout(timeout);if(active)setLoading(false);});
  return()=>{active=false;clearTimeout(timeout);controller.abort();};
 },[subject,topic,mode,retry]);
 function change(s:string,t:string){setSubject(s);setTopic(t);setLoading(true);setFlipped(false);pending.current=null;setPendingRating(null);}
 async function rate(rating:number){if(!card||busy)return;pending.current??={id:crypto.randomUUID(),rating};setPendingRating(pending.current.rating);setError("");
  try{const r=await mutate({action:"rate_card",questionId:card.id,mode,rating:pending.current.rating,requestId:pending.current.id}) as {dueAt:string};setNextDue(r.dueAt);setCards(v=>v.slice(1));setFlipped(false);pending.current=null;setPendingRating(null);requestAnimationFrame(()=>cardRef.current?.focus({preventScroll:true}));}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível confirmar a classificação. Tente novamente; a revisão não será duplicada.");}
 }
 const collectionHref=(all:boolean)=>"/premium/estudos?"+new URLSearchParams({area:"reviews",collection:all?"all":"errors",...(session?{session:session.id}:{})});
 return <section className={styles.reviewPanel}>
  <nav className={styles.collections} aria-label="Coleção de cartões">
   <Link href={collectionHref(false)} aria-current={mode==="review"?"page":undefined} aria-disabled={busy||undefined} onClick={e=>{if(busy)e.preventDefault();}}>Meus erros</Link>
   <Link href={collectionHref(true)} aria-current={mode==="flashcard"?"page":undefined} aria-disabled={busy||undefined} onClick={e=>{if(busy)e.preventDefault();}}>Explorar cartões</Link>
  </nav>
  <p className={styles.reviewIntro}>{mode==="review"?"Reveja seus erros e fortaleça o que aprendeu.":"Pratique outros conteúdos com revisão espaçada."}</p>
  <details className={styles.cardFilters}><summary>Filtrar cartões{subject&&<span>{subjects[subject as keyof typeof subjects]}</span>}</summary>
   <div className={styles.formGrid}><label>Matéria<select disabled={busy} value={subject} onChange={e=>change(e.target.value,"")}><option value="">Todas</option>{Object.entries(subjects).map(([s,l])=><option key={s} value={s}>{l}</option>)}</select></label><label>Assunto<select disabled={busy} value={topic} onChange={e=>change(subject,e.target.value)}><option value="">Todos</option>{data.topics.filter(t=>!subject||t.subject===subject).map(t=><option key={t.subject+t.topic}>{t.topic}</option>)}</select></label></div>
  </details>
  {loading?<p role="status">Carregando revisões…</p>:card?<>
   <div className={styles.cardMeta}><div><strong>{subjects[card.subject as keyof typeof subjects]}</strong><span>{card.topic}</span></div><span>{cards.length} cartões</span></div>
   {card.errors>1&&<p className={styles.help}>{card.errors} erros registrados nesta questão. Vale revisar com atenção.</p>}
   <button ref={cardRef} className={styles.flashcard} aria-pressed={flipped} disabled={busy} onClick={()=>setFlipped(v=>!v)}>
    <span className={`${styles.cardFace} ${flipped?styles.answerFace:""}`} key={card.id+String(flipped)}>
     {flipped?<><strong className={styles.cardLabel}>Resposta {card.answer}</strong><strong>{card.options["ABCDE".indexOf(card.answer)]}</strong><span className={styles.cardStatement}>{card.explanation}</span><span className={styles.cardHint}>Toque para voltar à pergunta</span></>:<><strong className={styles.cardLabel}>Pergunta</strong><span className={styles.cardStatement}>{card.statement}</span><span className={styles.cardChoices}>{card.options.map((o,i)=><span key={i}><b>{"ABCDE"[i]}</b><span>{o}</span></span>)}</span><span className={styles.cardHint}>Toque para revelar a resposta</span></>}
    </span>
   </button>
   {flipped&&<fieldset className={styles.ratings} disabled={busy||pendingRating!==null}><legend>Como foi lembrar?</legend>{[[1,"Não lembrei"],[2,"Difícil"],[3,"Lembrei"],[4,"Fácil"]].map(([n,label])=><button type="button" className={styles.ratingButton} key={n} onClick={()=>void rate(Number(n))}>{label}</button>)}</fieldset>}
  </>:<div className={styles.empty}><h2>{mode==="review"?"Suas revisões estão em dia":"Tudo revisado por enquanto"}</h2><p>{mode==="review"?"Erros e revisões que chegarem à data aparecem aqui. Você também pode explorar outros cartões.":"Troque a matéria ou volte na próxima data de revisão."}</p><div className={styles.actions}>{mode==="review"&&<Link className={styles.primary} href={collectionHref(true)}>Explorar cartões</Link>}<button className={styles.secondary} onClick={()=>{setLoading(true);setRetry(n=>n+1);}}>Conferir próximos cartões</button></div><Link className={styles.textLink} href="/historico">Revisão básica gratuita no histórico</Link></div>}
  {nextDue&&<p className={styles.notice} role="status">Revisão salva. Próximo encontro deste cartão: {new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date(nextDue))}.</p>}
  {error&&<p className={styles.error} role="alert">{error} <button className={styles.secondary} disabled={busy} onClick={()=>pending.current?void rate(pending.current.rating):(setLoading(true),setRetry(n=>n+1))}>Tentar novamente</button></p>}
  <details className={styles.history}><summary>Histórico de revisões e cartões</summary>{data.reviewHistory.length?<ul>{data.reviewHistory.map(h=><li key={h.id}>{new Date(h.reviewed_at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})} · {["","Não lembrei","Difícil","Lembrei","Fácil"][h.rating]}<span className={styles.historyMeta}>{h.mode==="review"?"Meus erros":"Explorar cartões"} · Próxima revisão: {new Date(h.due_at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})}</span></li>)}</ul>:<p>Suas classificações aparecerão aqui.</p>}</details>
 </section>;
}
