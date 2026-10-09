"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {parseDailyLimits,nextLimitsRefresh,type DailyLimits} from "./limits-contract";
export function useDailyLimits(preview:boolean,unavailable:boolean){
 const [limits,setLimits]=useState<DailyLimits|null>(null),[failed,setFailed]=useState(false);
 const active=useRef<AbortController|null>(null);
 const refresh=useCallback(async()=>{
  if(preview||unavailable)return;
  active.current?.abort();const controller=new AbortController();active.current=controller;
  const timer=setTimeout(()=>controller.abort(),15000);
  try{
   const r=await fetch("/api/limits",{cache:"no-store",credentials:"same-origin",signal:controller.signal});
   if(!r.ok)throw new Error();const data=parseDailyLimits(await r.json());
   if(active.current===controller){setLimits(data);setFailed(false);}
  }catch{if(active.current===controller){setLimits(null);setFailed(true);}}
  finally{clearTimeout(timer);}
 },[preview,unavailable]);
 useEffect(()=>{const initial=setTimeout(()=>void refresh(),0);const visible=()=>{if(document.visibilityState==="visible")void refresh();};
  document.addEventListener("visibilitychange",visible);
  return()=>{clearTimeout(initial);active.current?.abort();active.current=null;document.removeEventListener("visibilitychange",visible);};
 },[refresh]);
 // Atualizar também ao vencer o período pago; o banco continua decidindo cada nova tentativa.
 useEffect(()=>{if(!limits)return;
  const timer=setTimeout(()=>void refresh(),nextLimitsRefresh(limits,Date.now()));return()=>clearTimeout(timer);
 },[limits,refresh]);
 return {limits,failed,refresh};
}
