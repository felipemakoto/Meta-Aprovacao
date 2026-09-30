"use client";
import { useRef,useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { parseSimulationState,type Simulation } from "@/lib/quiz/simulation-contract";
import SimulationSession from "./simulation-session";
import { demoSimulations,previewSimulation } from "./simulation-preview";
import base from "../quiz/quiz.module.css";
import styles from "./simulations.module.css";
export default function Simulations({items=[],unavailable=false,preview=false}:{items?:Simulation[];unavailable?:boolean;preview?:boolean}){
 const catalog=preview?demoSimulations:items;
 const [id,setId]=useState(catalog[0]?.id??""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const [demo,setDemo]=useState<ReturnType<typeof previewSimulation>|null>(null);
 const lock=useRef(false),router=useRouter();
 async function start(){
  if(lock.current||!id)return;
  if(preview){setDemo(previewSimulation(catalog.find(i=>i.id===id)!));return;}
  lock.current=true;setBusy(true);setError("");
  try{const r=await fetch("/api/simulations",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"start",id}),signal:AbortSignal.timeout(15000)});
   if(!r.ok)throw new Error(r.status===401?"Entre novamente para iniciar um simulado.":r.status===429?"Aguarde um minuto para tentar novamente.":"Não foi possível iniciar. O conteúdo pode estar em revisão.");
   const state=parseSimulationState(await r.json());router.push("/simulados/"+("quiz" in state?state.quiz.id:state.result.id));
  }catch(e){setError(e instanceof Error&&e.name==="Error"?e.message:"Confira sua conexão e tente novamente.");}finally{lock.current=false;setBusy(false);}
 }
 if(demo)return <SimulationSession preview initial={demo} onBack={()=>setDemo(null)}/>;
 return <div className={base.page}>
  <header className={base.header}><Link href="/" className={base.brand}><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt=""/></span>ETEC / IF</Link><Link className={base.exit} href="/dashboard">Meus estudos</Link></header>
  <main><h1 className={styles.title}>Simulados</h1><p className={styles.intro}>A correção aparece ao finalizar.</p>
   {unavailable?<section role="status"><p>Não foi possível carregar os simulados.</p><button className={base.back} onClick={()=>window.location.reload()}>Tentar novamente</button></section>:catalog.length===0?<p role="status" className={styles.intro}>Os simulados estão em preparação. Você poderá começar quando as questões estiverem revisadas.</p>:<>
    <fieldset className={styles.options} disabled={busy}><legend className={base.srOnly}>Escolha um simulado</legend>{catalog.map(item=><label key={item.id} className={styles.option}><input type="radio" name="simulation" checked={id===item.id} onChange={()=>setId(item.id)}/><span><strong>{item.title}</strong><small>{item.count} questões · {item.subject?({matematica:"Matemática",portugues:"Português",ciencias:"Ciências",historia:"História",geografia:"Geografia"}[item.subject]):"5 matérias"}</small></span></label>)}</fieldset>
    <p className={styles.note}>Você pode revisar suas escolhas antes de enviar.</p>
    <button className={`${base.continue} ${styles.start}`} disabled={busy||!id} onClick={()=>void start()}>{busy?"Preparando…":"Iniciar simulado"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt=""/></button>
   </>}
   <div role="status" aria-live="polite">{error&&<p>{error}</p>}</div>
   <Link className={styles.historyLink} href="/historico?kind=simulations">Ver meu histórico</Link>
  </main>{preview&&<footer className={styles.footer}>Dados ilustrativos.</footer>}
 </div>;
}
