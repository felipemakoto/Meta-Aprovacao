"use client";
type RiskSdk={initAntifraud:()=>Promise<unknown>;completeAntifraudProfile:()=>Promise<void>;getAntifraudReference:()=>string;cleanupAntifraud:()=>void};
declare global {interface Window {Cakto?:{CaktoSDK:new(config:{client_id:string;environment:"production"})=>RiskSdk}}}
let pending:Promise<RiskSdk>|undefined;
export function prepareRisk(clientId:string){
 if(!pending)pending=(async()=>{
  if(!window.Cakto)await new Promise<void>((resolve,reject)=>{
   const script=document.createElement("script");script.src="https://cakto-sdk.pages.dev/cakto-sdk.min.js";
   script.integrity="sha384-qcgP2dyzgsIoXaJ1XUg1hE2dTlwfEv24MgMEA3Bsc6YwWEQIRb7ntFnF+kMcg2Ko";script.crossOrigin="anonymous";script.async=true;
   const timer=setTimeout(()=>{script.remove();reject(Error("card_unavailable"));},15000);
   script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error("card_unavailable"));};document.head.append(script);
  });
  if(!window.Cakto)throw Error("card_unavailable");const sdk=new window.Cakto.CaktoSDK({client_id:clientId,environment:"production"});await sdk.initAntifraud();return sdk;
 })().catch(error=>{pending=undefined;throw error;});
 return pending;
}
export function validCard(number:string,month:string,year:string,cvv:string,at=new Date()){
 if(!/^\d{13,19}$/.test(number)||/^(\d)\1+$/.test(number)||!/^(0[1-9]|1[0-2])$/.test(month)||!/^\d{2}$/.test(year)||!/^\d{3,4}$/.test(cvv))return false;
 let sum=0,double=false;for(let i=number.length-1;i>=0;i--){let n=Number(number[i]);if(double){n*=2;if(n>9)n-=9;}sum+=n;double=!double;}
 return sum%10===0&&Number("20"+year)*12+Number(month)>=at.getFullYear()*12+at.getMonth()+1;
}
export async function tokenizeCard(clientId:string,card:{holderName:string;number:string;expMonth:string;expYear:string;cvv:string}){
 // Direct browser-to-Cakto tokenization avoids SDK error logging of Axios request bodies.
 const r=await fetch("https://api.cakto.com.br/public_api/card-tokens/",{method:"POST",headers:{"Content-Type":"application/json","X-client-id":clientId},body:JSON.stringify(card),cache:"no-store",credentials:"omit",redirect:"error",signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error("card_unavailable");const v=await r.json();if(typeof v.cardToken!=="string"||!v.cardToken||v.cardToken.length>512||typeof v.expiresAt!=="string"||!Number.isFinite(Date.parse(v.expiresAt))||Date.parse(v.expiresAt)<=Date.now())throw Error("card_unavailable");return v.cardToken as string;
}
