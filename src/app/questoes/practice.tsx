"use client";
import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { subjects,publicQuestion,publicFeedback,type Filters,type PracticeQuestion,type PracticeFeedback } from "@/lib/quiz/practice-contract";
import base from "../quiz/quiz.module.css";
import styles from "./practice.module.css";
const initial:Filters={subject:"matematica",topic:"",difficulty:"all",exam:"all"};
const sample:PracticeQuestion={id:"00000000-0000-4000-8000-000000000019",questionId:"00000000-0000-4000-8000-000000000001",expiresAt:"2030-01-01T00:00:00Z",subject:"matematica",topic:"Porcentagem",statement:"Uma mochila custa R$ 80,00. Com 15% de desconto, qual é o preço final?",options:["R$ 12,00","R$ 68,00","R$ 65,00","R$ 72,00","R$ 92,00"]};
const messages:Record<string,string>={login_required:"Entre na sua conta para continuar.",attempt_unavailable:"O prazo desta questão terminou. Aplique os filtros para começar outra.",already_answered:"Esta questão já foi respondida. Continue com uma nova questão.",rate_limited:"Muitas solicitações. Aguarde um minuto antes de tentar novamente."};
export default function Practice({preview=false,unavailable=false}:{preview?:boolean;unavailable?:boolean}){
  const [filters,setFilters]=useState<Filters>(preview?{...initial,topic:"Porcentagem"}:initial);
  const [topics,setTopics]=useState<string[]>(preview?["Porcentagem"]:[]);
  const [topicsError,setTopicsError]=useState(false);
  const [question,setQuestion]=useState<PracticeQuestion|null>(preview?sample:null);
  const [answer,setAnswer]=useState(preview?"B":"");
  const [feedback,setFeedback]=useState<PracticeFeedback|null>(null);
  const [busy,setBusy]=useState(false);const lock=useRef(false);
  const [message,setMessage]=useState(unavailable?"Não foi possível verificar sua conta. Recarregue a página para tentar novamente.":"");
  const heading=useRef<HTMLHeadingElement>(null);const status=useRef<HTMLDivElement>(null);
  const [loaded,setLoaded]=useState(preview);
  useEffect(()=>{
    if(preview||unavailable)return;
    const controller=new AbortController();
    fetch(`/api/practice?subject=${encodeURIComponent(filters.subject)}`,{cache:"no-store",signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();return r.json();}).then(b=>{if(!Array.isArray(b.topics)||b.topics.some((t:unknown)=>typeof t!=="string"))throw new Error();setTopics(b.topics);setTopicsError(false);}).catch(()=>{if(!controller.signal.aborted){setTopics([]);setTopicsError(true);}});
    return()=>controller.abort();
  },[filters.subject,preview,unavailable]);
  function change(field:keyof Filters,value:string){setFilters(f=>({...f,[field]:value,...(field==="subject"?{topic:""}:{})}));setQuestion(null);setFeedback(null);setAnswer("");setMessage("");setLoaded(false);if(field==="subject")setTopics([]);}
  async function run(action:"next"|"answer"){
    if(lock.current||unavailable)return;if(action==="answer"&&(!answer||!question))return;
    lock.current=true;setBusy(true);setMessage("");
    try{
      if(preview){
        if(action==="next"){setQuestion(filters.subject==="matematica"&&["","Porcentagem"].includes(filters.topic)&&["all","easy"].includes(filters.difficulty)?sample:null);setAnswer("");setFeedback(null);}
        else setFeedback({answer,correct:answer==="B",correctAnswer:"B",explanation:"15% de R$ 80,00 são R$ 12,00. Subtraindo o desconto: 80 − 12 = 68."});
        setLoaded(true);return;
      }
      const body=action==="next"?{action,filters,previous:question?.questionId??null}:{action,id:question!.id,answer};
      const r=await fetch("/api/practice",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
      const b=await r.json();if(!r.ok)throw new Error(messages[b.error]??"Não foi possível concluir. Tente novamente.");
      if(action==="next"){setQuestion(b.question?publicQuestion(b.question):null);setAnswer("");setFeedback(null);setLoaded(true);}
      else setFeedback(publicFeedback(b.feedback));
    }catch(e){setMessage(e instanceof Error && Object.values(messages).includes(e.message)?e.message:"A conexão falhou. Tente novamente; sua resposta não será duplicada.");}
    finally{lock.current=false;setBusy(false);requestAnimationFrame(()=>{if(action==="next")heading.current?.focus();else status.current?.focus();});}
  }
  return <div className={base.page}>
    <header className={base.header}><Link className={base.brand} href="/" aria-label="ETEC / IF — início"><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt="" /></span>ETEC / IF</Link><Link className={base.exit} href="/dashboard">Meus estudos</Link></header>
    <main><h1 className={styles.title}>Questões</h1>
      <form onSubmit={e=>{e.preventDefault();void run("next");}}><fieldset className={styles.filters} disabled={busy||unavailable}>
        <div className={styles.field}><label htmlFor="subject">Matéria</label><select id="subject" value={filters.subject} onChange={e=>change("subject",e.target.value)}>{Object.entries(subjects).map(([v,label])=><option key={v} value={v}>{label}</option>)}</select></div>
        <div className={styles.field}><label htmlFor="topic">Assunto</label><select id="topic" value={filters.topic} onChange={e=>change("topic",e.target.value)}><option value="">Todos</option>{topics.map(t=><option key={t}>{t}</option>)}</select></div>
        <details className={styles.advanced}>
          <summary>Mais filtros{(filters.difficulty!=="all"||filters.exam!=="all")?" · ativos":""}</summary>
          <div className={styles.advancedGrid}>
            <div className={styles.field}><label htmlFor="difficulty">Dificuldade</label><select id="difficulty" value={filters.difficulty} onChange={e=>change("difficulty",e.target.value)}>{[["all","Todas"],["easy","Fácil"],["medium","Média"],["hard","Difícil"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
            <div className={styles.field}><label htmlFor="exam">Prova</label><select id="exam" value={filters.exam} onChange={e=>change("exam",e.target.value)}>{[["all","ETEC e IF"],["etec","ETEC"],["if","IF"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
          </div>
        </details>
        <button className={styles.apply} type="submit">{busy?"Aguarde…":"Buscar questão"}</button>
      </fieldset></form>
      {topicsError&&<p className={styles.notice}>Não foi possível carregar os assuntos. Você pode praticar com “Todos” ou mudar a matéria para tentar novamente.</p>}
      <div ref={feedback?undefined:status} tabIndex={-1} role="status" aria-live="polite">{message&&<p className={styles.notice}>{message}{message===messages.login_required&&<> <Link href="/login">Entrar</Link></>}</p>}</div>
      {question?<section className={styles.content}><p className={styles.metadata}>{subjects[question.subject as keyof typeof subjects]} · {question.topic}</p><h2 ref={heading} tabIndex={-1} className={`${base.question} ${styles.question}`}>{question.statement}</h2>
        <form onSubmit={e=>{e.preventDefault();void run("answer");}}><fieldset className={base.options} disabled={busy||!!feedback}><legend className={base.srOnly}>Escolha uma alternativa</legend>{question.options.map((option,i)=>{const letter="ABCDE"[i];return <label className={base.option} key={letter}><input type="radio" name="answer" value={letter} required checked={answer===letter} onChange={()=>setAnswer(letter)} /><span className={base.letter}>{letter}</span><span>{option}</span></label>;})}</fieldset>
        {!feedback&&<button className={base.continue} disabled={busy||!answer}>{busy?"Conferindo…":"Conferir resposta"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></button>}</form>
        {feedback&&<div ref={status} tabIndex={-1} role="status" aria-live="polite"><section className={styles.feedback}><h3>{feedback.correct?"Você acertou":"Vamos revisar"}</h3><p>Resposta correta: {feedback.correctAnswer} — {question.options["ABCDE".indexOf(feedback.correctAnswer)]}</p><p>{feedback.explanation}</p></section></div>}
        {feedback&&<button className={base.continue} disabled={busy} onClick={()=>void run("next")}>Próxima questão<Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></button>}
      </section>:loaded&&<p className={styles.notice}>Nenhuma questão encontrada. Tente outros filtros.</p>}
    </main>{preview&&<footer className={styles.footer}>Dados ilustrativos.</footer>}
  </div>;
}
