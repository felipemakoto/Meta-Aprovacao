"use client";
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from "react";
import Link from "next/link";
import {appRelease,releaseLabel} from "@/lib/pwa/release";
import {installationContext,isAppContext,type Platform} from "@/lib/pwa/platform";

type InstallEvent=Event & {prompt:()=>Promise<void>;userChoice:Promise<{outcome:string}>};
type Release={version:string;build:string};
type PwaState={standalone:boolean|null;os:Platform|null;instructions:string;canInstall:boolean;install:()=>Promise<void>;message:string;available:Release|null;waiting:boolean;update:()=>void;workerError:boolean};
const Context=createContext<PwaState|null>(null);
export function usePwa(){const state=useContext(Context);if(!state)throw Error("Missing PwaProvider");return state;}
export default function PwaProvider({children}:{children:ReactNode}){
 const [standalone,setStandalone]=useState<boolean|null>(null),[os,setOs]=useState<Platform|null>(null),[instructions,setInstructions]=useState(''),[canInstall,setCanInstall]=useState(false),[message,setMessage]=useState(''),[available,setAvailable]=useState<Release|null>(null),[waiting,setWaiting]=useState(false),[workerError,setWorkerError]=useState(false);
 const prompt=useRef<InstallEvent|null>(null),registration=useRef<ServiceWorkerRegistration|null>(null),installBusy=useRef(false);
 useEffect(()=>{
  const display=matchMedia('(display-mode: standalone)');
  const detect=()=>setStandalone(isAppContext(display.matches,(navigator as Navigator & {standalone?:boolean}).standalone===true));
  const frame=requestAnimationFrame(()=>{const context=installationContext(navigator.userAgent,navigator.platform,navigator.maxTouchPoints);setOs(context.os);setInstructions(context.instructions);detect();});
  const before=(event:Event)=>{event.preventDefault();prompt.current=event as InstallEvent;setCanInstall(true);};
  // appinstalled does not mean this browser tab is now running standalone.
  const installed=()=>{prompt.current=null;setCanInstall(false);setMessage('Instalação concluída. Abra pelo ícone do aplicativo.');detect();};
  display.addEventListener('change',detect);window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',installed);
  return()=>{cancelAnimationFrame(frame);display.removeEventListener('change',detect);window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',installed);};
 },[]);
 useEffect(()=>{
  // Avoid an offline worker over dev/HMR builds. Production localhost is allowed.
  if(process.env.NODE_ENV!=='production'||!window.isSecureContext||!('serviceWorker' in navigator))return;
  let alive=true,reg:ServiceWorkerRegistration|undefined,installing:ServiceWorker|null=null;
  const changed=()=>{if(alive)setWaiting(!!reg?.waiting);};
  const found=()=>{installing=reg?.installing??null;installing?.addEventListener('statechange',changed);};
  const check=()=>{if(document.visibilityState==='hidden')return;void reg?.update().catch(()=>{});void fetch('/app-version.json',{cache:'no-store',credentials:'omit'}).then(r=>r.ok?r.json():null).then(value=>{if(alive&&value&&typeof value.version==='string'&&/^[a-f0-9]{40,64}$/.test(value.build))setAvailable({version:value.version,build:value.build});}).catch(()=>{});};
  void navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(value=>{if(!alive)return;reg=value;registration.current=value;changed();reg.addEventListener('updatefound',found);found();check();}).catch(()=>{if(alive)setWorkerError(true);});
  document.addEventListener('visibilitychange',check);window.addEventListener('online',check);
  return()=>{alive=false;reg?.removeEventListener('updatefound',found);installing?.removeEventListener('statechange',changed);document.removeEventListener('visibilitychange',check);window.removeEventListener('online',check);};
 },[]);
 async function install(){if(installBusy.current)return;if(!prompt.current){setMessage(instructions);return;}installBusy.current=true;const event=prompt.current;prompt.current=null;setCanInstall(false);try{await event.prompt();const choice=await event.userChoice;setMessage(choice.outcome==='accepted'?'Pedido de instalação aceito. Aguarde a confirmação do navegador.':'Instalação cancelada. Você pode continuar usando o site.');}catch{setMessage(instructions);}finally{installBusy.current=false;}}
 function update(){
  if(document.querySelector('[data-settings-dirty="true"]')){setMessage('Salve suas configurações antes de atualizar.');return;}
  if(!navigator.onLine){setMessage('Conecte-se à internet antes de atualizar.');return;}
  if(!window.confirm('Conclua ou salve suas atividades em todas as abas antes de continuar. Atualizar recarrega esta página. Continuar?'))return;
  const worker=registration.current?.waiting;
  if(worker){navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});worker.postMessage({type:'ACTIVATE_UPDATE'});}else location.reload();
 }
 const newer=available?.build&&appRelease.build&&available.build!==appRelease.build;
 return <Context.Provider value={{standalone,os,instructions,canInstall,install,message,available,waiting,update,workerError}}>{children}{(waiting||newer)&&<aside className="pwa-update" aria-label="Atualização do aplicativo"><span>Uma atualização está disponível.</span><Link href="/configuracoes?secao=app">Ver em Aplicativo</Link></aside>}</Context.Provider>;
}
export function InstallLink({className}:{className?:string}){const {standalone}=usePwa();return standalone===false?<Link href="/baixar" className={className}>Instalar</Link>:null;}
export {appRelease,releaseLabel};
