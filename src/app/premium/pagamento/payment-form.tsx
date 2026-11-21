"use client";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {validCpf,type DirectMethod,type DirectState} from "@/lib/subscriptions/direct-contract";
import CheckoutAction from "../checkout-action";
import {prepareRisk,retainRisk,tokenizeCard,validCard} from "./card-sdk";
import styles from "./payment.module.css";

const labels:Record<DirectMethod,string>={pix_auto:"Pix Automático",pix:"Pix",credit_card:"Cartão"};
export default function PaymentForm({enabled,email,clientId}:{enabled:boolean;email:string;clientId:string}){
 const router=useRouter(),lock=useRef(false),clock=useRef({server:0,local:0}),form=useRef<HTMLFormElement>(null);
 const [state,setState]=useState<DirectState|null>(null),[method,setMethod]=useState<DirectMethod>("pix_auto"),[busy,setBusy]=useState(false),[error,setError]=useState(""),[remaining,setRemaining]=useState(0),[copied,setCopied]=useState(false);
 const cardActive=enabled&&method==="credit_card"&&(state?.status==="empty"||state?.status==="failed");
 useEffect(()=>{
  if(!cardActive)return;let active=true;const risk=retainRisk(clientId);
  void risk.ready.catch(()=>{if(active)setError("Não foi possível iniciar a proteção do cartão. Escolha Pix ou tente novamente.");});
  return()=>{active=false;risk.release();};
 },[cardActive,clientId]);
 const accept=useCallback((value:DirectState)=>{
  if(!value||!["empty","processing","unknown","awaiting","paid","failed","complete"].includes(value.status)||typeof value.hasPremium!=="boolean"||!Number.isFinite(Date.parse(value.serverNow)))throw Error("unavailable");
  clock.current={server:Date.parse(value.serverNow),local:performance.now()};setState(value);
  if(value.hasPremium)router.replace("/premium/estudos");
 },[router]);
 const load=useCallback(async()=>{
  const r=await fetch("/api/premium/payment",{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(10000)});
  if(r.status===401){router.replace("/login");return;}if(!r.ok)throw Error("unavailable");accept(await r.json());
 },[accept,router]);
 useEffect(()=>{
  let alive=true;const started=performance.now();
  const check=()=>{if(alive&&document.visibilityState==="visible")void load().catch(()=>{if(alive)setError("Não foi possível consultar o pagamento. Atualize o status antes de continuar.");});};
  check();const timer=setInterval(()=>{if(performance.now()-started<900000)check();else clearInterval(timer);},15000);
  return()=>{alive=false;clearInterval(timer);};
 },[enabled,load]);
 useEffect(()=>{
  if(!state?.expiresAt)return;const expiry=Date.parse(state.expiresAt);
  const tick=()=>setRemaining(Math.max(0,Math.ceil((expiry-clock.current.server-(performance.now()-clock.current.local))/1000)));
  tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer);
 },[state]);
 async function send(command:unknown){
  const r=await fetch("/api/premium/payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(command),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(55000)});
  if(r.status===401){router.replace("/login");return;}
  const value=await r.json();if(!r.ok)throw Error(["direct_fees_changed","direct_card_interest_unconfirmed","direct_method_unavailable"].includes(value.error)?"Esta forma de pagamento está indisponível nas condições anunciadas. Não foi enviada nova cobrança. Consulte o status ou fale com o suporte.":value.error==="checkout_rate_limited"?"Aguarde antes de tentar novamente.":value.error==="invalid_input"?"Confira os dados preenchidos.":"Não foi possível concluir. Consulte o status antes de tentar novamente.");accept(value);
 }
 async function action(kind:"resume"|"refresh"){
  if(lock.current)return;lock.current=true;setBusy(true);setError("");
  try{await send({action:kind});}catch(e){setError(e instanceof Error?e.message:"Não foi possível consultar o status.");}finally{lock.current=false;setBusy(false);}
 }
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(lock.current||!state||!["empty","failed"].includes(state.status))return;
  const element=event.currentTarget;if(!element.reportValidity())return;
  lock.current=true;setBusy(true);setError("");let dispatched=false;
  try{
   const fields=new FormData(element),text=(key:string)=>String(fields.get(key)??"").trim(),digits=(key:string)=>text(key).replace(/\D/g,"");
   const cpf=digits("cpf"),phone=digits("phone");if(!validCpf(cpf)||!/^\d{10,11}$/.test(phone))throw Error("Confira o CPF e o telefone com DDD.");
   let fingerprint=sessionStorage.getItem("meta-payment-device");if(!fingerprint){fingerprint=crypto.randomUUID();sessionStorage.setItem("meta-payment-device",fingerprint);}
   const command:Record<string,unknown>={action:"create",method,name:text("name"),cpf,phone:"55"+phone,fingerprint};
   if(method==="credit_card"){
    const number=digits("number"),month=text("expMonth"),year=text("expYear"),cvv=digits("cvc"),holder=text("holderName");
    if(!validCard(number,month,year,cvv)||holder.length<3)throw Error("Confira os dados e a validade do cartão.");
    const sdk=await prepareRisk(clientId);await sdk.completeAntifraudProfile();
    command.antifraud=sdk.getAntifraudReference();
    try{command.cardToken=await tokenizeCard(clientId,{holderName:holder,number,expMonth:month,expYear:"20"+year,cvv});}
    finally{for(const name of ["number","cvc"]){const field=element.elements.namedItem(name);if(field instanceof HTMLInputElement)field.value="";}}
   }
   dispatched=true;await send(command);
  }catch(e){
   setError(e instanceof Error&&e.message!=="card_unavailable"?e.message:"Não foi possível validar o cartão. Confira os dados ou escolha Pix.");
   if(dispatched){setState(null);try{await load();}catch{/* Form remains locked until authoritative status is read. */}}
  }finally{lock.current=false;setBusy(false);}
 }
 const pending=state&&["processing","unknown","awaiting","paid"].includes(state.status),canPay=state&&["empty","failed"].includes(state.status);
 return <main className={styles.page}><Link className={styles.back} href="/premium">← Seu plano Premium</Link><header><h1>Seu próximo passo nos estudos.</h1><p>Ative o Premium na sua conta.</p></header><div className={styles.layout}>
  <section className={styles.panel} aria-labelledby="payment-heading"><h2 id="payment-heading">Pagamento</h2>
   {<>
    {!state&&<p role="status">Consultando seu pagamento…</p>}
    {state?.hasPremium&&<p role="status">Premium confirmado. Abrindo seus estudos…</p>}
    {pending&&<div className={styles.status}>
     <h3>{state.status==="paid"?"Pagamento recebido":state.qrCode?"Conclua no aplicativo do seu banco":"Conferindo seu pagamento"}</h3>
     <p>{state.status==="paid"?"Estamos confirmando o acesso à sua conta.":state.qrCode?state.method==="pix_auto"?"Confira o valor e a autorização das cobranças mensais no banco. Autorizar o Pix Automático, por si só, não libera o Premium.":"Confira o valor e o destinatário antes de pagar.":"Não inicie outro pagamento enquanto verificamos esta tentativa."}</p>
     {state.qrCode&&<>
      {/* Locally generated QR; never loaded from a third-party image service. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {remaining>0&&<img className={styles.qr} src={state.qrImage} width="256" height="256" alt="Código QR do seu pagamento Pix"/>}
      <p>{remaining>0?`Validade deste código Pix: ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,"0")}`:"O prazo deste código terminou. Consulte o status para saber se o pagamento foi recebido."}</p>
      {remaining>0&&<><textarea readOnly aria-label="Código Pix copia e cola" value={state.qrCode}/><button className={styles.secondary} type="button" onClick={async()=>{try{await navigator.clipboard.writeText(state.qrCode!);setCopied(true);}catch{setError("Selecione e copie o código Pix acima.");}}}>{copied?"Código copiado":"Copiar código Pix"}</button></>}
     </>}
     {enabled&&state.status==="unknown"&&state.canResume&&<button className={styles.primary} disabled={busy} onClick={()=>action("resume")}>Retomar a mesma tentativa</button>}
     <button className={styles.secondary} disabled={busy} onClick={()=>action("refresh")}>{busy?"Consultando…":"Atualizar status"}</button>
     <Link href="/suporte">Já pagou ou precisa de ajuda?</Link>
    </div>}
    {!enabled&&canPay&&<><p>Conclua sua assinatura no checkout seguro da Cakto.</p><CheckoutAction/></>}
    {enabled&&canPay&&<form ref={form} onSubmit={submit}>
     {state.status==="failed"&&<p role="status">Pagamento não concluído. Confira os dados ou escolha outro método.</p>}
     <fieldset disabled={busy}><legend>Como você quer pagar?</legend><div className={styles.methods}>{(Object.keys(labels) as DirectMethod[]).map(value=><label key={value} data-selected={method===value}><input type="radio" name="method" value={value} checked={method===value} onChange={()=>{setMethod(value);setError("");}}/>{labels[value]}</label>)}</div></fieldset>
     <p>{method==="pix_auto"?"Autorize a renovação mensal no seu banco.":method==="pix"?"Pagamento da mensalidade atual. No Pix comum, siga as instruções da Cakto para renovar.":"Cobrança mensal no cartão, até o cancelamento. Os dados do cartão são enviados diretamente à Cakto."}</p>
     <fieldset disabled={busy} className={styles.fields}><legend>Dados de quem paga</legend>
      <label>Nome completo<input name="name" autoComplete="name" required minLength={3} maxLength={120}/></label>
      <label>Conta que receberá o Premium<input value={email} readOnly autoComplete="off"/></label>
      <div className={styles.pair}><label>CPF<input name="cpf" inputMode="numeric" autoComplete="off" required maxLength={14} onBlur={event=>event.currentTarget.setCustomValidity(validCpf(event.currentTarget.value.replace(/\D/g,""))?"":"Confira o CPF.")} onInput={event=>event.currentTarget.setCustomValidity("")}/></label><label>Telefone com DDD<input name="phone" type="tel" autoComplete="tel-national" required minLength={10} maxLength={16}/></label></div>
      {method==="credit_card"&&<><label>Nome no cartão<input name="holderName" autoComplete="cc-name" required minLength={3} maxLength={120}/></label><label>Número do cartão<input name="number" inputMode="numeric" autoComplete="cc-number" required minLength={13} maxLength={23}/></label><div className={styles.pair}><label>Validade<div className={styles.expiry}><input name="expMonth" aria-label="Mês de validade" placeholder="MM" pattern="0[1-9]|1[0-2]" inputMode="numeric" autoComplete="cc-exp-month" maxLength={2} required/><span>/</span><input name="expYear" aria-label="Ano de validade, dois dígitos" placeholder="AA" pattern="[0-9]{2}" inputMode="numeric" autoComplete="cc-exp-year" maxLength={2} required/></div></label><label>Código de segurança<input name="cvc" type="password" inputMode="numeric" autoComplete="cc-csc" pattern="[0-9]{3,4}" maxLength={4} required/></label></div><p>A Cakto utiliza verificações de segurança do dispositivo para prevenir fraudes no pagamento com cartão. <Link href="/privacidade">Saiba mais</Link>.</p></>}
      <label className={styles.agreement}><input type="checkbox" required/>Li os termos e autorizo a assinatura de R$ 23,98/mês, incluindo a taxa Cakto, conforme a forma de pagamento escolhida.</label>
      <button className={styles.primary} type="submit" aria-busy={busy}>{busy?"Processando…":method==="credit_card"?"Assinar por R$ 23,98/mês":"Gerar Pix · R$ 23,98"}</button>
     </fieldset>
    </form>}
   </>}
   {error&&<div role="alert" className={styles.error}><p>{error}</p>{!state&&<button className={styles.secondary} onClick={()=>void load().catch(()=>setError("Consulta indisponível. Tente novamente em instantes."))}>Consultar novamente</button>}</div>}
  </section>
  <aside className={styles.summary}><h2>Premium mensal</h2><dl><div><dt>Assinatura</dt><dd>R$ 22,99</dd></div><div><dt>Taxa Cakto</dt><dd>R$ 0,99</dd></div><div className={styles.total}><dt>Total por mês</dt><dd>R$ 23,98</dd></div></dl><p>Mesmo preço desde a primeira cobrança. Renovação mensal até o cancelamento.</p><details><summary>Benefícios e condições</summary><ul><li>Tudo do Gratuito</li><li>Questões e simulados sem limite diário</li><li>Planejamento, diagnóstico e revisão com flashcards</li><li>Calendário e provas anteriores</li></ul><details><summary>Como cancelo?</summary><p>Solicite o cancelamento de futuras renovações pelo <Link href="/suporte">suporte</Link>, usando o e-mail da compra. Cancelamento e reembolso são pedidos diferentes.</p></details><details><summary>Quando o acesso é liberado?</summary><p>Após a confirmação e vinculação do pagamento. Gerar um código ou autorizar o Pix Automático não significa pagamento confirmado.</p></details></details><p>Menor de idade? Contrate com seu responsável.</p><nav aria-label="Informações do pagamento"><Link href="/termos">Termos</Link><Link href="/privacidade">Privacidade</Link><Link href="/suporte">Suporte</Link></nav></aside>
 </div></main>;
}
