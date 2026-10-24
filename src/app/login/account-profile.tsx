"use client";
import {useEffect,useRef,useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {parseAccountProfile,type AccountProfile,type AccountCommand,type AccountPlan} from "@/lib/account/contract";
import {applyMotionPreference} from "@/lib/account/preferences";
import {applyThemePreference} from "@/lib/account/theme";
import {parsePreferences} from "@/lib/account/settings-contract";
import {applyPreferences} from "@/lib/account/settings-device";
import styles from "./account-profile.module.css";

const messages:Record<string,string>={login_required:"Entre novamente para editar seu perfil.",invalid_input:"Use de 2 a 32 letras, números, espaços, pontos, hífens ou sublinhados no nome.",invalid_image:"Escolha uma foto JPG, PNG ou WebP válida, sem animação e de até 16 megapixels.",upload_too_large:"A foto deve ter no máximo 2 MB.",rate_limited:"Muitas alterações. Aguarde alguns minutos antes de tentar novamente."};
export default function AccountProfilePanel({email="",hideSettings=false}:{email?:string;plan?:AccountPlan;hideSettings?:boolean}){
 const [profile,setProfile]=useState<AccountProfile|null>(null),[nickname,setNickname]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const upload=useRef<HTMLInputElement>(null),lock=useRef(false),editor=useRef<HTMLDialogElement>(null);
 const Title=hideSettings?"h3":"h1";
 function accept(data:AccountProfile,resetFields=true){setProfile(data);if(resetFields){setNickname(data.nickname);}applyMotionPreference(data.reduceMotion);applyThemePreference(data.theme);}
 useEffect(()=>{
  const abort=new AbortController();
  fetch("/api/account/profile",{cache:"no-store",signal:AbortSignal.any([abort.signal,AbortSignal.timeout(10000)])}).then(async r=>{if(!r.ok)throw Error();const data=parseAccountProfile(await r.json());if(!abort.signal.aborted)accept(data);}).catch(()=>{if(!abort.signal.aborted)setError("Não foi possível carregar seu perfil. Recarregue a página para tentar novamente.");}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});
  if(!hideSettings)fetch("/api/account/settings?view=preferences",{cache:"no-store",signal:abort.signal}).then(async r=>{if(r.ok)applyPreferences(parsePreferences((await r.json()).preferences));}).catch(()=>{});
  return()=>abort.abort();
 },[hideSettings]);
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
 const photoSettings=<section className={styles.photoSettings}><h3>Foto de perfil</h3><div className={styles.photoActions}><button type="button" className={styles.photoEdit} aria-label="Alterar foto" disabled={!profile||busy} onClick={()=>{if(!editor.current?.open)editor.current?.showModal();upload.current?.click();}}><span className={styles.avatar}>{profile?.avatarVersion?<Image unoptimized src={`/api/account/avatar?v=${profile.avatarVersion}`} width={64} height={64} alt=""/>:<span aria-hidden="true">{profile?.nickname?.slice(0,1).toUpperCase()||"M"}</span>}</span><span className={styles.photoPencil} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z"/></svg></span></button>{profile?.avatarVersion&&<button type="button" disabled={busy} onClick={()=>void change({action:"remove_avatar"})}>Remover foto</button>}</div></section>;
 return <section className={styles.profile} data-account-profile data-embedded-profile={hideSettings} aria-label="Perfil e configurações" aria-busy={loading||busy}>
  {!hideSettings&&<div className={styles.header}><Title>{hideSettings?"Seu perfil":"Minha conta"}</Title>{!hideSettings&&<Link className={styles.gear} href="/configuracoes" aria-label="Abrir configurações"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="M9.5 3.5h5l.5 2 1.7 1 2-.6 2.5 4.3-1.5 1.4v2l1.5 1.4-2.5 4.3-2-.6-1.7 1-.5 2h-5l-.5-2-1.7-1-2 .6-2.5-4.3 1.5-1.4v-2l-1.5-1.4 2.5-4.3 2 .6 1.7-1Z"/><circle cx="12" cy="12.5" r="3"/></svg></Link>}</div>}
  <div className={styles.identity}>
   <div className={styles.avatar}>{profile?.avatarVersion?<Image unoptimized src={`/api/account/avatar?v=${profile.avatarVersion}`} width={88} height={88} alt="Sua foto de perfil"/>:<span aria-hidden="true">{profile?.nickname?.slice(0,1).toUpperCase()||"M"}</span>}</div>
   <div className={styles.who}><div className={styles.nameRow}><h2>{profile?.nickname||"Seu perfil"}</h2><button type="button" className={styles.edit} aria-label="Editar nome e foto" aria-haspopup="dialog" disabled={!profile||busy} onClick={()=>{setNickname(profile?.nickname??"");editor.current?.showModal();}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15Z"/></svg></button></div>{email&&<p>{email}</p>}</div>
  </div>
  {loading&&<p role="status">Carregando perfil…</p>}
  {error&&<p className={styles.error} role="alert">{error}</p>}
  {notice&&<p className={styles.notice} role="status">{notice}</p>}
  <dialog ref={editor} className={styles.settings} aria-labelledby="account-editor-title">
   <div className={styles.menuHeader}><h2 id="account-editor-title">Editar perfil</h2><button type="button" className={styles.close} aria-label="Fechar edição do perfil" onClick={()=>editor.current?.close()}>×</button></div>
   {error&&<p className={styles.error} role="alert">{error}</p>}{notice&&<p className={styles.notice} role="status">{notice}</p>}
  <input ref={upload} type="file" tabIndex={-1} accept="image/jpeg,image/png,image/webp" aria-label="Escolher foto de perfil" className={styles.file} disabled={!profile||busy} onChange={e=>{const file=e.target.files?.[0];e.target.value="";void photo(file);}}/>
   {photoSettings}
   <form onSubmit={e=>{e.preventDefault();void change({action:"save",nickname,reduceMotion:profile?.reduceMotion??false,theme:profile?.theme??"light"});}}><fieldset disabled={!profile||busy}>
    <label className={styles.field}>Nome<input value={nickname} maxLength={32} autoComplete="name" placeholder="Como quer ser chamado?" onChange={e=>setNickname(e.target.value)}/></label>
    <button className={styles.save} type="submit">{busy?"Salvando…":"Salvar nome"}</button>
   </fieldset></form>
  </dialog>
 </section>;
}
