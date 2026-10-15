"use client";
import styles from "./quiz.module.css";
import {useEffect,useState,type Ref} from "react";
import {RESULT_TRANSITION_MS} from "@/lib/quiz/result-transition";

export default function CorrectionLoading({title="Estamos conferindo as respostas.",compact=false,headingRef,timed=false,complete=false}:{title?:string;compact?:boolean;headingRef?:Ref<HTMLHeadingElement>;timed?:boolean;complete?:boolean}) {
  const [elapsedProgress,setElapsedProgress]=useState(0);
  useEffect(()=>{
    if(!timed)return;
    const started=performance.now();
    const timer=setInterval(()=>setElapsedProgress(Math.min(99,Math.floor((performance.now()-started)/RESULT_TRANSITION_MS*100))),100);
    return()=>clearInterval(timer);
  },[timed]);
  const progress=complete?100:elapsedProgress;
  return <section className={compact?styles.loadingCompact:styles.message} role="status" aria-live="polite" aria-busy="true">
    {compact?<p>{title}</p>:<><p className={styles.stepLabel}>Último passo</p><h1 ref={headingRef} tabIndex={-1}>{title}</h1><p>Seu resultado já vai aparecer.</p></>}
    <div className={`${styles.loadingBar}${timed?` ${styles.timedBar}`:""}`} role="progressbar" aria-label={title} aria-valuemin={timed?0:undefined} aria-valuemax={timed?100:undefined} aria-valuenow={timed?progress:undefined} aria-valuetext={timed?`${progress}%`:"Em andamento"}><span style={timed?{width:`${progress}%`}:undefined}/></div>
  </section>;
}
