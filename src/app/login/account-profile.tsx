"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {parseAccountProfile,type AccountProfile,type AccountCommand,type AccountPlan} from "@/lib/account/contract";
import {applyMotionPreference} from "@/lib/account/preferences";
import {applyThemePreference,type Theme} from "@/lib/account/theme";
import styles from "./account-profile.module.css";

const messages:Record<string,string>={login_required:"Entre novamente para editar seu perfil.",invalid_input:"Use de 2 a 32 letras, números, espaços, pontos, hífens ou sublinhados no nome.",invalid_image:"Escolha uma foto JPG, PNG ou WebP válida, sem animação e de até 16 megapixels.",upload_too_large:"A foto deve ter no máximo 2 MB.",rate_limited:"Muitas alterações. Aguarde alguns minutos antes de tentar novamente."};
export default function AccountProfilePanel({email="",plan="unknown"}:{email?:string;plan?:AccountPlan}){
 const [profile,setProfile]=useState<AccountProfile|null>(null),[nickname,setNickname]=useState(""),[reduce,setReduce]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const upload=useRef<HTMLInputElement>(null),lock=useRef(false),settings=useRef<HTMLDialogElement>(null);
 const [theme,setTheme]=useState<Theme>("light");
 function accept(data:AccountProfile,resetFields=true){setProfile(data);if(resetFields){setNickname(data.nickname);setReduce(data.reduceMotion);setTheme(data.theme);}applyMotionPreference(data.reduceMotion);applyThemePreference(data.theme);}
 useEffect(()=>{
  const abort=new AbortController();
  fetch("/api/account/profile",{cache:"no-store",signal:AbortSignal.any([abort.signal,AbortSignal.timeout(10000)])}).then(async r=>{if(!r.ok)throw Error();const data=parseAccountProfile(await r.json());if(!abort.signal.aborted)accept(data);}).catch(()=>{if(!abort.signal.aborted)setError("Não foi possível carregar seu perfil. Recarregue a página para tentar novamente.");}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});
  return()=>abort.abort();
 },[]);
 async function send(command:AccountCommand){
  const r=await fetch("/api/account/profile",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(command),signal:AbortSignal.timeout(25000)});
  const data=await r.json();if(!r.ok)throw Error(messages[data.error]??"Não foi possível salvar agora. Tente novamente.");return parseAccountProfile(data);
 }
 async function change(command:AccountCommand){
  if(lock.current)return;lock.current=true;setBusy(true);setError("");setNotice("");
  try{accept(await send(command),command.action==="save");setNotice(command.action==="save"?"Perfil e preferências salvos.":command.action==="avatar"?"":"Foto removida.");}
  catch(e){setError(e instanceof Error?e.message:"Não foi possível salvar agora.");}
  finally{lock.current=false;setBusy(false);}
 }
 async function photo(file:File|undefined){
  if(!file||lock.current)return;
  if(file.size>2097152){setError(messages.upload_too_large);return;}
  if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setError(messages.invalid_image);return;}
  lock.current=true;setBusy(true);setError("");setNotice("");
  try{
   const encoded=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.onerror=()=>reject(Error("Não foi possível ler a foto."));reader.readAsDataURL(file);});
   accept(await send({action:"avatar",image:encoded}),false);setNotice("");
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível enviar a foto.");}
  finally{lock.current=false;setBusy(false);}
 }
 return <section className={styles.profile} data-account-profile aria-label="Perfil e configurações" aria-busy={loading||busy}>
  <div className={styles.header}><h1>Minha conta</h1><button type="button" className={styles.gear} aria-label="Abrir configurações" aria-haspopup="dialog" onClick={()=>settings.current?.showModal()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M9.5 3.5h5l.5 2 1.7 1 2-.6 2.5 4.3-1.5 1.4v2l1.5 1.4-2.5 4.3-2-.6-1.7 1-.5 2h-5l-.5-2-1.7-1-2 .6-2.5-4.3 1.5-1.4v-2l-1.5-1.4 2.5-4.3 2 .6 1.7-1Z"/><circle cx="12" cy="12.5" r="3"/></svg></button></div>
  <div className={styles.identity}>
   <div className={styles.avatar}>{profile?.avatarVersion?<Image unoptimized src={`/api/account/avatar?v=${profile.avatarVersion}`} width={88} height={88} alt="Sua foto de perfil"/>:<span aria-hidden="true">{profile?.nickname?.slice(0,1).toUpperCase()||"M"}</span>}</div>
   <div className={styles.who}><h2>{profile?.nickname||"Seu perfil"}</h2>{email&&<p>{email}</p>}</div>
  </div>
  {loading&&<p role="status">Carregando perfil…</p>}
  {error&&<p className={styles.error} role="alert">{error}</p>}
  {notice&&<p className={styles.notice} role="status">{notice}</p>}
  <dialog ref={settings} className={styles.settings} aria-labelledby="account-settings-title">
   <div className={styles.menuHeader}><h2 id="account-settings-title">Configurações</h2><button type="button" className={styles.close} aria-label="Fechar configurações" onClick={()=>settings.current?.close()}>×</button></div>
   <div className={styles.plan}><span>Você está com o plano:</span><strong>{plan==="premium"?"Premium":plan==="normal"?"Normal (Gratuito)":"Não foi possível consultar"}</strong><Link href="/premium" onClick={()=>settings.current?.close()}>Ver meu plano</Link></div>
   {error&&<p className={styles.error} role="alert">{error}</p>}{notice&&<p className={styles.notice} role="status">{notice}</p>}
  <input ref={upload} type="file" tabIndex={-1} accept="image/jpeg,image/png,image/webp" aria-label="Escolher foto de perfil" className={styles.file} disabled={!profile||busy} onChange={e=>{const file=e.target.files?.[0];e.target.value="";void photo(file);}}/>
   <section className={styles.photoSettings} aria-labelledby="account-photo-title"><h3 id="account-photo-title">Foto de perfil</h3><div className={styles.photoActions}><button type="button" disabled={!profile||busy} onClick={()=>upload.current?.click()}>Alterar foto</button>{profile?.avatarVersion&&<button type="button" disabled={busy} onClick={()=>void change({action:"remove_avatar"})}>Remover foto</button>}</div></section>
   <form onSubmit={e=>{e.preventDefault();void change({action:"save",nickname,reduceMotion:reduce,theme});}}><fieldset disabled={!profile||busy}>
    <label className={styles.field}>Nome<input value={nickname} maxLength={32} autoComplete="name" placeholder="Como quer ser chamado?" onChange={e=>setNickname(e.target.value)}/></label>
    <label className={styles.field}>Aparência<select value={theme} onChange={e=>setTheme(e.target.value as Theme)}><option value="light">Modo claro</option><option value="dark">Modo escuro</option><option value="system">Acompanhar o dispositivo</option></select></label>
    <label className={styles.check}><input type="checkbox" checked={reduce} onChange={e=>setReduce(e.target.checked)}/><span>Reduzir animações no site</span></label>
    <button className={styles.save} type="submit">{busy?"Salvando…":"Salvar alterações"}</button>
   </fieldset></form>
   <div className={styles.links}><Link href="/recuperar-senha">Redefinir minha senha</Link></div>
  </dialog>
 </section>;
}
