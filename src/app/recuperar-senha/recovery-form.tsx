"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { parseNewPassword } from "@/lib/auth/recovery-contract";
import styles from "../cadastro/signup.module.css";
const messages: Record<string,string> = {
  invalid_input:"Confira os campos. As senhas devem ser iguais, com pelo menos 8 caracteres e até 72 bytes.",
  rate_limited:"Limite de tentativas atingido. Aguarde antes de solicitar novamente.",
  recovery_required:"Este acesso expirou ou não permite trocar a senha. Solicite um novo link.",
  weak_password:"Escolha uma senha mais forte, diferente de senhas conhecidas.",
  same_password:"Escolha uma senha diferente da atual.",
  recovery_unavailable:"Não foi possível concluir agora. Tente novamente mais tarde.",
};
export default function RecoveryForm({update=false,preview=false}:{update?:boolean;preview?:boolean}) {
  const [busy,setBusy] = useState(false);
  const [done,setDone] = useState(false);
  const [error,setError] = useState("");
  const lock = useRef(false);
  const status = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  function showError(message:string) { setError(message); requestAnimationFrame(()=>status.current?.focus()); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = update ? {password:String(data.get("password") ?? ""),confirmPassword:String(data.get("confirmPassword") ?? "")} : {email:String(data.get("email") ?? "")};
    if (update && !parseNewPassword(body)) { showError(messages.invalid_input); return; }
    if (preview) { showError("Prévia visual: nenhuma senha foi alterada."); return; }
    lock.current=true;setBusy(true);setError("");
    try {
      const response = await fetch(update ? "/api/auth/password" : "/api/auth/recovery",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
      const result = await response.json();
      if (response.ok && result.status === (update ? "password_updated" : "check_email")) {
        form.reset();setDone(true);requestAnimationFrame(()=>title.current?.focus());
      } else showError(messages[result.error] ?? messages.recovery_unavailable);
    } catch { showError(update ? "A conexão foi interrompida. Tente entrar com a nova senha antes de solicitar outro link." : "A conexão foi interrompida. Confira seu e-mail antes de tentar novamente: a solicitação pode ter sido recebida."); }
    finally { lock.current=false;setBusy(false); }
  }
  if (done) return <section>
    <h1 className={styles.title} ref={title} tabIndex={-1}>{update ? "Senha alterada" : "Confira seu e-mail"}</h1>
    <div className={styles.panel} role="status"><p>{update ? "Sua nova senha foi salva. Entre novamente para continuar." : "Se houver uma conta para este endereço, enviaremos um link para redefinir a senha. Confira também a pasta de spam."}</p>{!update && <p>Abra o link mais recente neste mesmo navegador. Você terá 15 minutos após abri-lo para salvar a nova senha.</p>}</div>
    <a className={styles.skip} href="/login">Voltar para entrar</a>
  </section>;
  return <section>
    <h1 className={styles.title}>{update ? "Nova senha" : "Recuperar senha"}</h1>
    <p className={styles.subtitle}>{update ? "Escolha sua nova senha." : "Receba um link para criar uma nova senha."}</p>
    <form className={styles.panel} onSubmit={submit} aria-busy={busy}>
      <fieldset className={styles.fields} disabled={busy}>
        {update ? <><PasswordField name="password" label="Nova senha" placeholder="Crie uma senha" /><PasswordField name="confirmPassword" label="Confirmar senha" placeholder="Repita a senha" /></> : <div className={styles.field}><label htmlFor="recovery-email">E-mail</label><input id="recovery-email" name="email" type="email" required maxLength={254} autoComplete="email" autoCapitalize="none" inputMode="email" spellCheck={false} placeholder="voce@exemplo.com" /></div>}
        {error && <div className={styles.error} ref={status} tabIndex={-1} role="alert">{error}{update && !preview && <Link href="/recuperar-senha">Solicitar novo link</Link>}</div>}
        <button type="submit" className={styles.submit}>{busy ? update ? "Salvando…" : "Enviando…" : update ? "Salvar nova senha" : "Enviar link"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></button>
      </fieldset>
      <noscript>Ative o JavaScript para recuperar sua senha.</noscript>
    </form>
    {!update && <p className={styles.note}>Abra o link neste mesmo navegador.</p>}
    <a className={styles.skip} href="/login">Voltar para entrar</a>
  </section>;
}
function PasswordField({name,label,placeholder}:{name:string;label:string;placeholder:string}) {
  const [visible,setVisible]=useState(false);
  return <div className={styles.field}><label htmlFor={name}>{label}</label><div className={styles.password}>
    <input id={name} name={name} type={visible ? "text" : "password"} required minLength={8} maxLength={72} autoComplete="new-password" placeholder={placeholder} aria-describedby={name === "password" ? "password-help" : undefined} />
    <button type="button" aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={()=>setVisible(!visible)}><Image src={visible ? "/icons/eye-slash.svg" : "/icons/eye.svg"} width={23} height={23} alt="" /></button>
  </div>{name === "password" && <p id="password-help" className={styles.help}>Use pelo menos 8 caracteres.</p>}</div>;
}
