"use client";
import {useEffect, useRef, useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {legalDocuments} from "@/lib/auth/legal-documents";
import {getSupabaseConfig} from "@/lib/supabase/config";
import styles from "./google-auth.module.css";
import formStyles from "./cadastro/signup.module.css";

export default function GoogleAuthButton({disabled = false, onPending}: {disabled?: boolean; onPending?: (pending: boolean) => void}) {
  const [available, setAvailable] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const checkbox = useRef<HTMLInputElement>(null);
  const alert = useRef<HTMLParagraphElement>(null);
  const controller = useRef<AbortController | null>(null);
  const attempt = useRef(0);
  const locked = useRef(false);
  useEffect(() => {
    const abort = new AbortController();
    void fetch("/api/auth/google/status", {cache: "no-store", signal: AbortSignal.any([abort.signal, AbortSignal.timeout(6000)])})
      .then(async response => {if (response.ok) setAvailable((await response.json()).enabled === true);})
      .catch(() => {});
    return () => {abort.abort(); controller.current?.abort();};
  }, []);
  function close() {
    attempt.current++;
    controller.current?.abort();
    locked.current = false;
    dialog.current?.close();
    setPending(false); onPending?.(false); setAccepted(false); setError("");
  }
  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    if (!accepted) {setError("Confirme a concordância com os termos e a leitura da política de privacidade."); checkbox.current?.focus(); return;}
    locked.current = true;
    const id = ++attempt.current;
    const abort = new AbortController(); controller.current = abort;
    setPending(true); onPending?.(true); setError("");
    try {
      const response = await fetch("/api/auth/google", {method: "POST", credentials: "same-origin", cache: "no-store", headers: {"Content-Type": "application/json"}, body: JSON.stringify({acceptedLegal: true, legalVersion: legalDocuments.version}), signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15000)])});
      const body = await response.json();
      if (attempt.current !== id || abort.signal.aborted) return;
      // Full navigation discards anonymous content cached before authentication.
      if (response.status === 409 && body.error === "already_authenticated") {window.location.replace(new URL("/login", window.location.origin).href); return;}
      if (!response.ok || typeof body.url !== "string") throw Error();
      const url = new URL(body.url);
      if (url.origin !== getSupabaseConfig().url || url.protocol !== "https:" || url.pathname !== "/auth/v1/authorize") throw Error();
      window.location.assign(url.href);
    } catch {
      if (attempt.current === id && !abort.signal.aborted) {
        setError("Não foi possível continuar com o Google agora. Tente novamente ou use seu e-mail.");
        requestAnimationFrame(() => alert.current?.focus());
      }
    } finally {
      if (attempt.current === id) {locked.current = false; setPending(false); onPending?.(false);}
    }
  }
  // Do not advertise a login method until the provider is actually enabled.
  if (!available) return null;
  return <div className={styles.section}>
    <button type="button" className={styles.googleButton} disabled={disabled || pending} onClick={() => dialog.current?.showModal()}><Image src="/icons/google.png" width={20} height={20} alt=""/>Continuar com Google</button>
    <div className={styles.divider}><span>ou use seu e-mail</span></div>
    <dialog className={styles.dialog} ref={dialog} aria-labelledby="google-title" aria-describedby="google-description" onCancel={event => {event.preventDefault(); close();}}>
      <button type="button" className={styles.close} onClick={close} aria-label="Fechar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      <p className={formStyles.eyebrow}>Sua conta na Meta Aprovação</p>
      <h2 id="google-title">Continue com o Google</h2>
      <p id="google-description" className={styles.description}>Use sua conta Google, sem criar outra senha.</p>
      <form onSubmit={start} noValidate aria-busy={pending}>
        <div className={formStyles.agreement}><label htmlFor="google-agreement" className={formStyles.agreementLabel}>
          <input id="google-agreement" ref={checkbox} type="checkbox" checked={accepted} required disabled={pending} aria-invalid={!!error && !accepted} aria-describedby={error ? "google-error" : undefined} onChange={event => {setAccepted(event.target.checked); setError("");}}/>
          <span>Concordo com os <Link href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</Link> e estou ciente da <Link href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</Link>.</span>
        </label></div>
        {error && <p id="google-error" className={styles.error} role="alert" tabIndex={-1} ref={alert}>{error}</p>}
        <button type="submit" disabled={pending} className={styles.googleButton}><Image src="/icons/google.png" width={20} height={20} alt=""/>{pending ? "Abrindo Google…" : "Continuar com Google"}</button>
        <button type="button" className={styles.cancel} onClick={close}>Voltar</button>
      </form>
    </dialog>
  </div>;
}
