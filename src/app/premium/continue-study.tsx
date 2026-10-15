"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import styles from "./plan-options.module.css";

export default function ContinueStudy() {
  const router=useRouter(),lock=useRef(false);
  const [busy,setBusy]=useState(false),[failed,setFailed]=useState(false);
  async function next() {
    if(lock.current)return;lock.current=true;setBusy(true);setFailed(false);
    try {
      const response=await fetch("/api/quiz/saved",{method:"POST",credentials:"same-origin",cache:"no-store",signal:AbortSignal.timeout(15000)});
      if(response.status===401){router.push("/login");return;}
      // No introductory cookie, or its expiry, must not prevent starting a simulation.
      if(!response.ok&&response.status!==404)throw Error();
      router.push("/simulados");
    }catch{setFailed(true);setBusy(false);lock.current=false;}
  }
  return <><button className={styles.primary} disabled={busy} onClick={()=>void next()}>{busy?"Preparando…":"Fazer meu simulado grátis"}<Image src="/icons/arrow-right.svg" width={21} height={21} alt=""/></button>
    {failed&&<div role="status" className={styles.note}><p>Não foi possível salvar seu teste inicial. Tente novamente ou <Link href="/simulados">continue sem salvar</Link>.</p></div>}
  </>;
}
