"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "../cadastro/signup.module.css";

const messages: Record<string, string> = {
  invalid_credentials: "Não foi possível entrar. Confira e-mail e senha e confirme seu e-mail pelo link do cadastro.",
  rate_limited: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  invalid_input: "Confira o e-mail e a senha antes de enviar.",
  auth_unavailable: "Não foi possível concluir agora. Tente novamente em alguns minutos.",
};
export default function LoginForm({ signedIn }: { signedIn: boolean }) {
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
      const response = await fetch(signedIn ? "/api/auth/logout" : "/api/auth/login", {
        method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signedIn ? {} : { email: String(data.get("email") ?? ""), password: String(data.get("password") ?? "") }), signal: AbortSignal.timeout(20000),
      });
      const body = await response.json();
      if (response.ok && body.status === (signedIn ? "signed_out" : "signed_in")) {
        // Full navigation discards the router's cached authenticated content.
        window.location.replace("/login"); return;
      }
      setError(messages[body.error] ?? messages.auth_unavailable);
    } catch { setError("A conexão foi interrompida. Recarregue a página para conferir sua sessão antes de tentar novamente."); }
    finally { lock.current = false; setBusy(false); requestAnimationFrame(() => alert.current?.focus()); }
  }
  return <section>
    <h1 className={styles.title}>{signedIn ? "Você está na sua conta" : "Entrar"}</h1>
    <p className={styles.subtitle}>{signedIn ? "Sua sessão está ativa neste navegador." : "Use seu e-mail e sua senha."}</p>
    <form className={styles.panel} onSubmit={submit} aria-busy={busy}>
      <fieldset className={styles.fields} disabled={busy}>
        {!signedIn && <>
          <div className={styles.field}><label htmlFor="login-email">E-mail</label><input id="login-email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="voce@exemplo.com" /></div>
          <div className={styles.field}><label htmlFor="login-password">Senha</label><div className={styles.password}>
            <input id="login-password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" required maxLength={1024} placeholder="Sua senha" />
            <button type="button" aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} onClick={() => setVisible(!visible)}><Image src={visible ? "/icons/eye-slash.svg" : "/icons/eye.svg"} width={23} height={23} alt="" /></button>
          </div></div>
        </>}
        {error && <div ref={alert} tabIndex={-1} role="alert" className={styles.error}>{error}</div>}
        <button className={styles.submit} type="submit">{busy ? signedIn ? "Saindo…" : "Entrando…" : signedIn ? "Sair da conta" : "Entrar"}{!signedIn && <Image src="/icons/arrow-right.svg" width={23} height={23} alt="" />}</button>
      </fieldset>
      <noscript>Ative o JavaScript para entrar ou sair da conta.</noscript>
    </form>
    {!signedIn && <><p className={styles.note}><Link href="/recuperar-senha">Esqueci minha senha</Link></p><p className={styles.note}>Ainda não tem conta? <Link href="/cadastro">Criar conta</Link></p></>}
    {signedIn && <><Link className={styles.skip} href="/quiz/result/saved">Ver último resultado salvo</Link><Link className={styles.skip} href="/quiz/result">Voltar ao resultado do teste para salvar</Link></>}
    <Link className={styles.skip} href="/">{signedIn ? "Voltar ao início" : "Continuar sem conta"}</Link>
  </section>;
}
