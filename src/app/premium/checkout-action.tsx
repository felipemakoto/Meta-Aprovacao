"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import styles from "./plan-options.module.css";

export default function CheckoutAction(){
  const router=useRouter();
  const pending=useRef(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function open(){
    if(pending.current)return;
    pending.current=true;setBusy(true);setError("");
    try{
      const response=await fetch("/api/premium/checkout",{method:"POST",headers:{Accept:"application/json"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
      if(response.status===401){router.push("/login");return;}
      if(!response.ok)throw Error(String(response.status));
      const data=await response.json(),url=new URL(data.url);
      if(url.protocol!=="https:"||url.hostname!=="pay.cakto.com.br"||url.port||url.username||url.password||url.hash)throw Error("destination");
      window.location.assign(url.href);
    }catch(e){
      setError(e instanceof Error&&e.message==="409"?"Seu Premium já está ativo. Atualize a página para continuar.":e instanceof Error&&e.message==="429"?"Aguarde um minuto antes de tentar novamente.":"Não foi possível abrir o checkout. Tente novamente.");
      pending.current=false;setBusy(false);
    }
  }
  return <><button className={styles.primary} type="button" onClick={open} disabled={busy} aria-busy={busy} aria-describedby={error?"checkout-error":undefined}>{busy?"Abrindo checkout…":"Assinar Premium"}</button>{error&&<p id="checkout-error" className={styles.note} role="alert">{error}</p>}</>;
}
