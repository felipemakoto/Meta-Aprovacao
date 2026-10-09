"use client";
import { useEffect,useRef,useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { parseSimulationState,type Simulation } from "@/lib/quiz/simulation-contract";
import SimulationSession from "./simulation-session";
import { demoSimulations,previewSimulation } from "./simulation-preview";
import base from "../quiz/quiz.module.css";
import styles from "./simulations.module.css";
import {useDailyLimits} from "@/lib/quiz/use-daily-limits";
import {dailyLimitMessage} from "@/lib/quiz/limits-contract";
export default function Simulations({items=[],unavailable=false,preview=false,limitReached=false}:{items?:Simulation[];unavailable?:boolean;preview?:boolean;limitReached?:boolean}){
 const catalog=preview?demoSimulations.filter(item=>item.count===10&&!item.subject):items;
 const quota=useDailyLimits(preview,unavailable);
 const [id,setId]=useState(catalog[0]?.id??""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [demo,setDemo]=useState<ReturnType<typeof previewSimulation>|null>(null);
 const lock=useRef(false),router=useRouter();
 const premium=quota.limits?.hasPremium;
 useEffect(()=>{if(!preview&&premium!==undefined)router.refresh();},[preview,premium,router]);
 const selectedId=catalog.some(item=>item.id===id)?id:catalog[0]?.id??"";
 async function start(){
  if(lock.current||!selectedId)return;
  if(preview){if(limitReached){setError("Você já iniciou o simulado de hoje. O limite renova à meia-noite de São Paulo. Tentativas abertas e a revisão continuam disponíveis.");return;}setDemo(previewSimulation(catalog.find(i=>i.id===selectedId)!));return;}
  lock.current=true;setBusy(true);setError("");
  try{const r=await fetch("/api/simulations",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start",id:selectedId}),signal:AbortSignal.timeout(15000)});
   if(!r.ok){const b=await r.json();throw new Error(b.error==="daily_simulation_limit"?"Você já iniciou o simulado de hoje. O limite renova à meia-noite de São Paulo. Tentativas abertas e a revisão continuam disponíveis.":r.status===401?"Entre novamente para iniciar um simulado.":r.status===429?"Aguarde um minuto para tentar novamente.":"Não foi possível iniciar. O conteúdo pode estar em revisão.");}
   const state=parseSimulationState(await r.json());router.push("/simulados/"+("quiz" in state?state.quiz.id:state.result.id));
  }catch(e){setError(e instanceof Error&&e.name==="Error"?e.message:"Confira sua conexão e tente novamente.");}finally{void quota.refresh();lock.current=false;setBusy(false);}
 }
 if(demo)return <SimulationSession preview initial={demo} onBack={()=>setDemo(null)}/>;
 return <div className={base.page}>
  <header className={base.header}><Link href="/" className={base.brand}><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt=""/></span>ETEC / IF</Link><Link className={base.exit} href="/dashboard">Meus estudos</Link></header>
  <main><h1 className={styles.title}>Simulados</h1><p className={styles.intro}>A correção aparece ao finalizar.</p>
   <p className={styles.note}>{preview?`${limitReached?0:1} de 1 novo simulado disponível hoje. Renova à meia-noite de São Paulo.`:quota.limits?dailyLimitMessage(quota.limits,"simulations"):quota.failed?"Não foi possível consultar seu saldo. Ao iniciar, a disponibilidade será verificada.":"Consultando o saldo de hoje…"}</p>
   {unavailable?<section role="status"><p>Não foi possível carregar os simulados.</p><button className={base.back} onClick={()=>window.location.reload()}>Tentar novamente</button></section>:catalog.length===0?<p role="status" className={styles.intro}>Os simulados estão em preparação. Você poderá começar quando as questões estiverem revisadas.</p>:<>
    <fieldset className={styles.options} disabled={busy}><legend className={base.srOnly}>Escolha um simulado</legend>{catalog.map(item=><label key={item.id} className={styles.option}><input type="radio" name="simulation" checked={selectedId===item.id} onChange={()=>setId(item.id)}/><span><strong>{item.title}</strong><small>{item.count} questões · {item.subject?({matematica:"Matemática",portugues:"Português",ciencias:"Ciências",historia:"História",geografia:"Geografia"}[item.subject]):"5 matérias"}</small></span></label>)}</fieldset>
    <p className={styles.note}>Você pode revisar suas escolhas antes de enviar.</p>
    <button className={`${base.continue} ${styles.start}`} disabled={busy||!selectedId} onClick={()=>void start()}>{busy?"Preparando…":"Iniciar simulado"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt=""/></button>
   </>}
   <div role="status" aria-live="polite">{error&&<p>{error}</p>}</div>
   <Link className={styles.historyLink} href="/historico?kind=simulations">Ver meu histórico</Link>
  </main>{preview&&<footer className={styles.footer}>Dados ilustrativos.</footer>}
 </div>;
}
