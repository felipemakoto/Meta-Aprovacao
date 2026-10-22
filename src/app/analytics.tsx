"use client";
import {useEffect,useState,useSyncExternalStore} from "react";
import {usePathname} from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import {analyticsId,analyticsChoiceKey,analyticsPath,parseAnalyticsChoice,type AnalyticsChoice} from "@/lib/analytics";
import styles from "./analytics.module.css";
declare global{interface Window{dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;"ga-disable-G-PMGG1W3N6N"?:boolean}}
const change="meta:analytics-consent",preferences="meta:analytics-preferences";
let memory:AnalyticsChoice|null=null,loaded=false,configured=false,lastPath="";
function snapshot(){
 if(!loaded){loaded=true;try{memory=parseAnalyticsChoice(localStorage.getItem(analyticsChoiceKey));}catch{/* Choice remains optional when storage is blocked. */}}
 return memory;
}
function subscribe(notify:()=>void){
 const storage=(event:StorageEvent)=>{if(event.key===analyticsChoiceKey||event.key===null){loaded=false;notify();}};
 window.addEventListener(change,notify);window.addEventListener("storage",storage);
 return()=>{window.removeEventListener(change,notify);window.removeEventListener("storage",storage);};
}
function clearAnalyticsCookies(){
 for(const cookie of document.cookie.split(";")){
  const name=cookie.split("=")[0].trim();if(!/^_ga(?:_|$)/.test(name))continue;
  document.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  document.cookie=`${name}=; Max-Age=0; Path=/; Domain=${location.hostname}; SameSite=Lax`;
 }
}
function queue(){
 window.dataLayer=window.dataLayer||[];
 // Google documents an Arguments entry, rather than an object event.
 // eslint-disable-next-line prefer-rest-params
 window.gtag=window.gtag||function(){window.dataLayer!.push(arguments);};
 return window.gtag;
}
export default function Analytics(){
 const pathname=usePathname(),choice=useSyncExternalStore(subscribe,snapshot,()=>null),[open,setOpen]=useState(false);
 useEffect(()=>{const show=()=>setOpen(true);window.addEventListener(preferences,show);return()=>window.removeEventListener(preferences,show);},[]);
 useEffect(()=>{
  const accepted=choice==="accepted";window["ga-disable-G-PMGG1W3N6N"]=!accepted;
  if(!accepted){lastPath="";if(window.gtag)window.gtag("consent","update",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});clearAnalyticsCookies();return;}
  const gtag=queue(),path=analyticsPath(pathname??"/"),page=location.origin+path;
  if(!configured){
   configured=true;
   gtag("consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
   gtag("js",new Date());
   gtag("config",analyticsId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,cookie_domain:"none",cookie_expires:2592000,page_location:page,page_referrer:"",page_title:"Meta Aprovação"});
  }
  gtag("consent","update",{analytics_storage:"granted",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"});
  gtag("set",{page_location:page,page_referrer:lastPath?location.origin+lastPath:"",page_title:"Meta Aprovação"});
  if(lastPath!==path){gtag("event","page_view",{send_to:analyticsId,page_location:page,page_referrer:lastPath?location.origin+lastPath:"",page_title:"Meta Aprovação"});lastPath=path;}
 },[choice,pathname]);
 function choose(value:AnalyticsChoice){
  memory=value;loaded=true;
  if(value==="rejected"){window["ga-disable-G-PMGG1W3N6N"]=true;clearAnalyticsCookies();}
  try{localStorage.setItem(analyticsChoiceKey,JSON.stringify({version:1,choice:value,at:Date.now()}));}catch{/* Apply the choice for this page even without persistence. */}
  setOpen(false);window.dispatchEvent(new Event(change));
 }
 return <>
  {choice==="accepted"&&<Script id="meta-google-analytics" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}/>}
  {(choice===null||open)&&<section className={styles.notice} aria-label="Preferências de cookies do site"><div><h2>Cookies do site</h2><p>Usamos cookies necessários para o site funcionar. Ao aceitar, você também permite cookies do Google Analytics para melhorar a plataforma. <Link href="/privacidade">Privacidade</Link></p></div><div className={styles.actions}><button type="button" onClick={()=>choose("rejected")}>Só necessários</button><button type="button" onClick={()=>choose("accepted")}>Aceitar cookies</button></div></section>}
 </>;
}
export function AnalyticsPreferences(){return <button className={styles.preferences} type="button" onClick={()=>window.dispatchEvent(new Event(preferences))}>Cookies de análise</button>;}
