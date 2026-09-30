"use client";
import { useEffect,useState } from "react";
import Home from "../src/app/page";
import Dashboard from "../src/app/dashboard/dashboard";
import History from "../src/app/historico/history";
import Practice from "../src/app/questoes/practice";
import Quiz from "../src/app/quiz/quiz";
import Result from "../src/app/quiz/result/result";
import Simulations from "../src/app/simulados/simulations";
import { demoTests,demoResult,demoReview } from "../src/app/historico/history-preview";
import type { GuestQuiz } from "../src/lib/quiz/contract";
type View="entrada"|"estudos"|"historico"|"questoes"|"quiz"|"resultado"|"simulados";
const labels:Record<View,string>={entrada:"Início",estudos:"Meus estudos",historico:"Histórico",questoes:"Questões",quiz:"Teste",resultado:"Resultado",simulados:"Simulados"};
function route(path:string):View|null {
 const p=new URL(path,"http://preview.local").pathname;
 if(p==="/")return "entrada";
 if(p.startsWith("/quiz/result"))return "resultado";
 if(p.startsWith("/quiz"))return "quiz";
 if(p.startsWith("/dashboard"))return "estudos";
 if(p.startsWith("/historico"))return "historico";
 if(p.startsWith("/questoes"))return "questoes";
 if(p.startsWith("/simulados"))return "simulados";
 return null;
}
const quiz:GuestQuiz={id:"demo-clean",startedAt:"2026-01-01T00:00:00Z",expiresAt:"2099-01-01T00:00:00Z",questionCount:10,questions:Array.from({length:10},(_,i)=>({id:"preview-"+i,position:i+1,version:1,subject:demoReview.subject,topic:demoReview.topic,statement:demoReview.statement,options:demoReview.options}))};
export default function MobileSitePreview(){
 const [state,setState]=useState<{view:View;path:string}>({view:"simulados",path:"/simulados"});
 useEffect(()=>{
  const listen=(e:Event)=>{const path=(e as CustomEvent<string>).detail;const view=route(path);if(view){setState({view,path});window.scrollTo({top:0,behavior:"instant"});}};
  window.addEventListener("etec-preview-navigation",listen);
  return ()=>window.removeEventListener("etec-preview-navigation",listen);
 },[]);
 const p=new URL(state.path,"http://preview.local").searchParams;
 const score=p.get("score")==="10"?10:p.get("score")==="0"?0:7;
 const review=p.get("review");
 return <>
  <aside style={{maxWidth:640,margin:"16px auto 0",padding:"12px 24px",borderBottom:"1px solid var(--color-divider)"}}>
   <label htmlFor="preview-screen" style={{display:"block",fontSize:12,color:"var(--color-text-secondary)",marginBottom:6}}>Demonstração · dados ilustrativos</label>
   <select id="preview-screen" value={state.view} onChange={e=>{setState({view:e.target.value as View,path:"/"});window.scrollTo({top:0,behavior:"instant"});}} style={{minHeight:44,padding:8,border:"1px solid var(--color-divider)",borderRadius:4,font:"inherit",width:"100%",background:"transparent",color:"inherit"}}>
    {Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}
   </select>
  </aside>
  {state.view==="entrada"&&<Home/>}
  {state.view==="estudos"&&<Dashboard preview simulations={1} summary={{answered:10,correct:7,latest:{id:demoTests[0].id,completedAt:demoTests[0].at,total:10,score:7}}}/>}
  {state.view==="historico"&&<History key={state.path} preview initialKind={p.get("kind")==="simulations"?"simulations":"tests"}/>}
  {state.view==="simulados"&&<Simulations preview/>}
  {state.view==="questoes"&&<Practice preview/>}
  {state.view==="quiz"&&<Quiz preview={quiz}/>}
  {state.view==="resultado"&&<Result key={state.path} saved preview={demoResult({...demoTests[0],score})} initialReview={review==="all"||review==="errors"?review:undefined}/>}
 </>;
}
