"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../cadastro/signup.module.css";
import accountStyles from "./login.module.css";
import GoogleAuthButton from "../google-auth-button";
import type {AccountPlan} from "@/lib/account/contract";
import AccountProfilePanel from "./account-profile";
import {clearPreferences} from "@/lib/account/settings-device";

const messages: Record<string, string> = {
  request_timeout: "O envio demorou demais. Confira sua conexão e tente novamente.",
  invalid_credentials: "Não foi possível entrar. Confira e-mail e senha e confirme seu e-mail pelo link do cadastro.",
  rate_limited: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  invalid_input: "Confira o e-mail e a senha antes de enviar.",
  auth_unavailable: "Não foi possível concluir agora. Tente novamente em alguns minutos.",
};
export default function LoginForm({ signedIn, showPremiumOffer=false,email="",plan="unknown" }: { signedIn: boolean; showPremiumOffer?: boolean;email?:string;plan?:AccountPlan }) {
  const [deleted,setDeleted]=useState(false);
  useEffect(()=>{if(signedIn)return;const frame=requestAnimationFrame(()=>{clearPreferences();try{if(sessionStorage.getItem('meta:account-deleted')==='true'){setDeleted(true);sessionStorage.removeItem('meta:account-deleted');}}catch{}});return()=>cancelAnimationFrame(frame);},[signedIn]);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const alert = useRef<HTMLDivElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const data = new FormData(event.currentTarget);
    lock.current = true; setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: String(data.get("email") ?? ""), password: String(data.get("password") ?? "") }), signal: AbortSignal.timeout(20000),
      });
      const body = await response.json();
      if (response.ok && body.status === "signed_in") {
        // Full navigation discards the router's cached authenticated content.
        window.location.replace("/login"); return;
      }
      setError(messages[body.error] ?? messages.auth_unavailable);
    } catch { setError("A conexão foi interrompida. Recarregue a página para conferir sua sessão antes de tentar novamente."); }
    finally { lock.current = false; setBusy(false); requestAnimationFrame(() => alert.current?.focus()); }
  }
  return <section className={accountStyles.content}>
    {deleted&&!signedIn&&<p role="status">Sua conta foi excluída.</p>}
    {!signedIn&&<h1 className={styles.title}>Entrar</h1>}
    {signedIn && <AccountProfilePanel email={email} plan={plan}/>}
    {signedIn && <nav className={accountStyles.actions} aria-label="Continuar na plataforma">
      <Link className={`${accountStyles.action} ${accountStyles.primary}`} href="/dashboard">Meus estudos<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></Link>
      <Link className={`${accountStyles.action} ${accountStyles.simulation}`} href="/simulados"><span>Fazer um simulado</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-7-7 7 7-7 7"/></svg></Link>
      <div className={accountStyles.quickLinks}><Link className={accountStyles.action} href="/historico">Histórico de estudos</Link><Link className={accountStyles.action} href="/estatisticas">Minhas estatísticas</Link></div>
      {showPremiumOffer && <Link className={`${accountStyles.action} ${accountStyles.upgrade}`} href="/premium"><span>Desbloquear Premium</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m7 17 10-10M7 7h10v10"/></svg></Link>}
    </nav>}
    {!signedIn && <div className={accountStyles.google}><GoogleAuthButton disabled={busy} onPending={setBusy}/></div>}
    {!signedIn&&<form className={styles.panel} onSubmit={submit} aria-busy={busy}>
      <fieldset className={styles.fields} disabled={busy}>
        {!signedIn && <>
          <div className={styles.field}><label htmlFor="login-email">E-mail</label><input id="login-email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="voce@exemplo.com" /></div>
          <div className={styles.field}><label htmlFor="login-password">Senha</label><div className={styles.password}>
            <input id="login-password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" required maxLength={1024} placeholder="Sua senha" />
            <button type="button" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} onClick={() => setVisible(!visible)}><Image src={visible ? "/icons/eye-slash.svg" : "/icons/eye.svg"} width={23} height={23} alt="" /></button>
          </div></div>
        </>}
        {error && <div ref={alert} tabIndex={-1} role="alert" className={styles.error}>{error}</div>}
        <button className={styles.submit} type="submit">{busy?"Entrando…":"Entrar"}{!signedIn && <Image src="/icons/arrow-right.svg" width={23} height={23} alt="" />}</button>
      </fieldset>
      <noscript>Ative o JavaScript para entrar na conta.</noscript>
    </form>}
    {!signedIn && <><p className={styles.note}><Link href="/recuperar-senha">Esqueci minha senha</Link></p><p className={styles.note}>Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></p></>}
  </section>;
}
