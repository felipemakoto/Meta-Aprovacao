"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {trackCheckout} from "./checkout-events";
import styles from "./plan-options.module.css";

export default function CheckoutAction({mobileSummary=false,total="R$ 23,98",integrated=false}:{mobileSummary?:boolean;total?:string;integrated?:boolean}={}){
  const router=useRouter();
  const pending=useRef(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  useEffect(()=>{
    const restore=()=>{pending.current=false;setBusy(false);};
    window.addEventListener("pageshow",restore);
    return()=>window.removeEventListener("pageshow",restore);
  },[]);
  async function open(placement:"summary"|"mobile"="summary"){
    if(pending.current)return;
    pending.current=true;setBusy(true);setError("");
    trackCheckout("checkout_start",{placement});
    if(integrated){router.push("/premium/pagamento");return;}
    try{
      const response=await fetch("/api/premium/checkout",{method:"POST",headers:{Accept:"application/json"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
      if(response.status===401){trackCheckout("checkout_error",{placement,reason:"login_required"});router.push("/login");return;}
      if(response.status===409){const value=await response.json();if(value.error==="payment_pending"){router.push("/premium/pagamento");return;}}
      if(!response.ok)throw Error(String(response.status));
      const data=await response.json(),url=new URL(data.url);
      if(url.protocol!=="https:"||url.hostname!=="pay.cakto.com.br"||url.port||url.username||url.password||url.hash||!/^\/[A-Za-z0-9_-]+$/.test(url.pathname)||[...url.searchParams.keys()].join()!=="sck"||!/^[a-f0-9]{64}$/.test(url.searchParams.get("sck")??""))throw Error("destination");
      trackCheckout("checkout_redirect",{placement});
      window.location.assign(url.href);
    }catch(e){
      trackCheckout("checkout_error",{placement,reason:e instanceof Error&&["409","429","503","destination"].includes(e.message)?e.message:"unavailable"});
      setError(e instanceof Error&&e.message==="payment_pending"?"Há um pagamento em andamento. Consulte o status em Pagamento Premium antes de pagar novamente.":e instanceof Error&&e.message==="409"?"Seu Premium já está ativo. Atualize a página para continuar.":e instanceof Error&&e.message==="429"?"Aguarde um minuto antes de tentar novamente.":"Não foi possível abrir o checkout. Tente novamente.");
      pending.current=false;setBusy(false);
    }
  }
  return <><button className={styles.primary} type="button" onClick={()=>open("summary")} disabled={busy} aria-busy={busy} aria-describedby={error?"checkout-error":undefined}>{busy?"Abrindo checkout…":"Assinar Premium"}</button>{error&&<p id="checkout-error" className={styles.note} role="alert">{error}</p>}{mobileSummary&&<div className={styles.mobileCheckout} aria-label="Resumo e pagamento"><div><strong>{total}/mês</strong><span>Total com a taxa Cakto</span></div><button className={styles.primary} type="button" onClick={()=>open("mobile")} disabled={busy} aria-busy={busy} aria-describedby={error?"checkout-mobile-error":undefined}>{busy?"Abrindo…":"Assinar Premium"}</button>{error&&<p id="checkout-mobile-error" className={styles.mobileError} role="alert">{error}</p>}</div>}</>;
}
