"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {subjects} from "@/lib/quiz/practice-contract";
import type {Card,Workspace,Session} from "@/lib/premium-study/contract";
import type {Mutate} from "./workspace";
import styles from "./study.module.css";
export default function CardsPanel({data,mode,busy,mutate,session}:{data:Workspace;mode:"review"|"flashcard";busy:boolean;mutate:Mutate;session?:Session}){
 const [subject,setSubject]=useState(session?.subject??""),[topic,setTopic]=useState(session?.topic??""),[cards,setCards]=useState<Card[]>([]),[flipped,setFlipped]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(""),[retry,setRetry]=useState(0),[nextDue,setNextDue]=useState("");
 const pending=useRef<{id:string;rating:number}|null>(null),card=cards[0];const [pendingRating,setPendingRating]=useState<number|null>(null);
 useEffect(()=>{const controller=new AbortController();let active=true;
  const timeout=setTimeout(()=>controller.abort(),20000);
  fetch(`/api/premium/study?view=cards&mode=${mode}&subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`,{cache:"no-store",credentials:"same-origin",signal:controller.signal})
   .then(async r=>{if(!r.ok)throw Error();return r.json();}).then(body=>{if(!Array.isArray(body.cards))throw Error();if(active){setCards(body.cards);setError("");}})
   .catch(()=>{if(active)setError("Não foi possível carregar os cartões. Tente novamente.");}).finally(()=>{clearTimeout(timeout);if(active)setLoading(false);});
  return()=>{active=false;clearTimeout(timeout);controller.abort();};
 },[subject,topic,mode,retry]);
 function change(s:string,t:string){setSubject(s);setTopic(t);setLoading(true);setFlipped(false);pending.current=null;setPendingRating(null);}
 async function rate(rating:number){if(!card||busy)return;pending.current??={id:crypto.randomUUID(),rating};setPendingRating(pending.current.rating);setError("");
  try{const r=await mutate({action:"rate_card",questionId:card.id,mode,rating:pending.current.rating,requestId:pending.current.id}) as {dueAt:string};setNextDue(r.dueAt);setCards(v=>v.slice(1));setFlipped(false);pending.current=null;setPendingRating(null);}
  catch{setError("Não foi possível confirmar a classificação. Tente novamente; a revisão não será duplicada.");}
 }
 return <section><p className={styles.intro}>{mode==="review"?"Revise questões em que você errou. A repetição espaçada ajusta o próximo encontro conforme sua dificuldade; erros recorrentes aparecem identificados.":"Frente, verso e uma nova revisão no momento adequado. Os cartões usam apenas questões publicadas com gabarito e explicação validados."}</p>
  <div className={styles.formGrid}><label>Matéria<select disabled={busy} value={subject} onChange={e=>change(e.target.value,"")}><option value="">Todas</option>{Object.entries(subjects).map(([s,l])=><option key={s} value={s}>{l}</option>)}</select></label><label>Assunto<select disabled={busy} value={topic} onChange={e=>change(subject,e.target.value)}><option value="">Todos</option>{data.topics.filter(t=>!subject||t.subject===subject).map(t=><option key={t.subject+t.topic}>{t.topic}</option>)}</select></label></div>
  {loading?<p role="status">Carregando revisões…</p>:card?<>
   <p>{subjects[card.subject as keyof typeof subjects]} · {card.topic}{card.errors>1?` · ${card.errors} erros registrados`:""} · {cards.length} cartões nesta seleção</p>
   <button className={`${styles.flashcard} ${flipped?styles.flipped:""}`} aria-pressed={flipped} onClick={()=>setFlipped(v=>!v)}><span className={styles.cardInner}><span className={styles.cardFront} aria-hidden={flipped}><strong>Frente</strong><span>{card.statement}</span><span className={styles.cardOptions}>{card.options.map((o,i)=><span key={i}>{"ABCDE"[i]}. {o}</span>)}</span><span>Toque para conferir</span></span><span className={styles.cardBack} aria-hidden={!flipped}><strong>Resposta {card.answer} · {card.options["ABCDE".indexOf(card.answer)]}</strong><span>{card.explanation}</span><span>Toque para voltar</span></span></span></button>
   {flipped&&<fieldset className={styles.ratings} disabled={busy||pendingRating!==null}><legend>Como foi lembrar?</legend>{[[1,"Não lembrei"],[2,"Difícil"],[3,"Lembrei"],[4,"Fácil"]].map(([n,label])=><button type="button" className={styles.secondary} key={n} onClick={()=>void rate(Number(n))}>{label}</button>)}</fieldset>}
  </>:<div className={styles.empty}><h2>{mode==="review"?"Nenhuma revisão pendente nesta seleção":"Tudo revisado por enquanto"}</h2><p>{mode==="review"?"Novos erros e revisões que chegarem à data aparecem aqui. A revisão básica no histórico continua gratuita.":"Troque a matéria ou volte na próxima data de revisão."}</p><button className={styles.secondary} onClick={()=>{setLoading(true);setRetry(n=>n+1);}}>Conferir próximos cartões</button><Link className={styles.secondary} href="/historico">Revisão básica no histórico</Link></div>}
  {nextDue&&<p className={styles.notice} role="status">Revisão salva. Próximo encontro deste cartão: {new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date(nextDue))}.</p>}
  {error&&<p className={styles.error} role="alert">{error} <button className={styles.secondary} disabled={busy} onClick={()=>pending.current?void rate(pending.current.rating):(setLoading(true),setRetry(n=>n+1))}>Tentar novamente</button></p>}
  <details className={styles.history}><summary>Histórico recente de revisões</summary>{data.reviewHistory.filter(h=>h.mode===mode).length?<ul>{data.reviewHistory.filter(h=>h.mode===mode).map(h=><li key={h.id}>{new Date(h.reviewed_at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})} · {["","Não lembrei","Difícil","Lembrei","Fácil"][h.rating]} · Próxima: {new Date(h.due_at).toLocaleDateString("pt-BR",{timeZone:"America/Sao_Paulo"})}</li>)}</ul>:<p>Suas classificações aparecerão aqui.</p>}</details>
 </section>;
}
