"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validateSignup, type SignupErrors, type SignupInput } from "@/lib/auth/signup-contract";
import {legalDocuments} from "@/lib/auth/legal-documents";
import styles from "./signup.module.css";

const messages: Record<string, string> = {
  request_timeout: "O envio demorou demais. Confira sua conexão e tente novamente.",
  rate_limited: "Muitas tentativas ou limite de e-mails atingido. Aguarde antes de tentar novamente.",
  weak_password: "Essa senha não foi aceita. Escolha uma senha mais forte e diferente de senhas conhecidas.",
  invalid_input: "Confira os dados e a concordância com os documentos antes de enviar.",
  already_authenticated: "Você já tem uma sessão ativa neste navegador.",
  signup_unavailable: "Não foi possível concluir o cadastro agora. Tente novamente mais tarde.",
};
export default function SignupForm() {
  const router = useRouter();
  const [fields, setFields] = useState<SignupErrors>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [activeSession, setActiveSession] = useState(false);
  const lock = useRef(false);
  const status = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const input: SignupInput = { email: String(data.get("email") ?? ""), password: String(data.get("password") ?? ""), confirmPassword: String(data.get("confirmPassword") ?? ""), acceptedLegal: data.get("acceptedLegal") === "on", legalVersion: legalDocuments.version };
    const invalid = validateSignup(input);
    setFields(invalid); setError("");
    const first = Object.keys(invalid)[0];
    if (first) { (form.elements.namedItem(first) as HTMLInputElement)?.focus(); return; }
    lock.current = true; setBusy(true);
    try {
      const response = await fetch("/api/auth/signup", { method: "POST", credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input), signal: AbortSignal.timeout(20000) });
      const body = await response.json();
      if (response.ok && body.status === "confirmed") { router.replace("/cadastro/confirmado"); return; }
      if (response.ok && body.status === "check_email") {
        form.reset(); setSent(true); requestAnimationFrame(() => heading.current?.focus());
      } else {
        setActiveSession(body.error === "already_authenticated");
        setError(messages[body.error] ?? messages.signup_unavailable);
        requestAnimationFrame(() => status.current?.focus());
      }
    } catch {
      setError("A conexão foi interrompida. Confira seu e-mail antes de tentar novamente: o cadastro pode ter sido recebido.");
      requestAnimationFrame(() => status.current?.focus());
    } finally { lock.current = false; setBusy(false); }
  }
  if (sent) return <section>
    <h1 className={styles.title} ref={heading} tabIndex={-1}>Confira seu e-mail</h1>
    <div className={styles.panel} role="status">
      <p>Se o cadastro puder ser feito, um link chegará ao seu e-mail. Confira também o spam.</p>
      <p>Abra o link neste navegador para escolher seu plano e continuar.</p>
    </div>
    <Link className={styles.skip} href="/">Voltar ao início</Link>
  </section>;
  return <section>
    <p className={styles.eyebrow}>Um espaço para a sua preparação</p>
    <h1 className={styles.title}>Criar conta</h1><p className={styles.subtitle}>Guarde seus resultados e descubra o próximo passo. Comece grátis.</p>
    <ul className={styles.benefits} aria-label="Vantagens da conta"><li>Histórico salvo</li><li>Progresso por matéria</li></ul>
    <form className={styles.panel} onSubmit={submit} noValidate aria-busy={busy}>
      <fieldset disabled={busy} className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="signup-email">E-mail</label>
          <input id="signup-email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="voce@exemplo.com" aria-invalid={!!fields.email} aria-describedby={fields.email ? "email-error" : undefined} />
          {fields.email && <p id="email-error" className={styles.fieldError}>{fields.email}</p>}
        </div>
        <PasswordField name="password" label="Senha" placeholder="Crie uma senha" error={fields.password} />
        <PasswordField name="confirmPassword" label="Confirmar senha" placeholder="Repita a senha" error={fields.confirmPassword} />
        <div className={`${styles.agreement} ${fields.acceptedLegal ? styles.agreementInvalid : ""}`}>
          <label className={styles.agreementLabel} htmlFor="acceptedLegal">
            <input id="acceptedLegal" name="acceptedLegal" type="checkbox" required aria-invalid={!!fields.acceptedLegal} aria-describedby={fields.acceptedLegal ? "agreement-error" : undefined} />
            <span>Concordo com os <Link href="/termos" target="_blank" rel="noopener noreferrer">Termos de Uso</Link> e estou ciente da <Link href="/privacidade" target="_blank" rel="noopener noreferrer">Política de Privacidade</Link>.</span>
          </label>
          {fields.acceptedLegal && <p id="agreement-error" className={styles.fieldError}>{fields.acceptedLegal}</p>}
        </div>
        {error && <div ref={status} tabIndex={-1} role="alert" className={styles.error}>{error}{activeSession && <Link href="/cadastro/confirmado">Ver estado da conta</Link>}</div>}
        <button type="submit" className={styles.submit}>{busy ? "Criando conta…" : "Criar conta grátis"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></button>
      </fieldset>
      <noscript>Ative o JavaScript para usar o formulário de cadastro.</noscript>
    </form>
    <p className={styles.confirmationNote}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>Confirme o e-mail para começar a estudar.</p>
    <p className={styles.note}>Já tem conta? <Link href="/login">Entrar</Link></p>
    <Link className={styles.skip} href="/">Continuar sem conta</Link>
  </section>;
}

function PasswordField({ name, label, placeholder, error }: { name: "password" | "confirmPassword"; label: string; placeholder: string; error?: string }) {
  const [visible, setVisible] = useState(false);
  const help = name === "password" ? "password-help" : "";
  return <div className={styles.field}>
    <label htmlFor={name}>{label}</label>
    <div className={styles.password}>
      <input id={name} name={name} type={visible ? "text" : "password"} required minLength={8} maxLength={72} autoComplete="new-password" placeholder={placeholder} aria-invalid={!!error} aria-describedby={[help, error ? `${name}-error` : ""].filter(Boolean).join(" ") || undefined} />
      <button type="button" aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}><Image src={visible ? "/icons/eye-slash.svg" : "/icons/eye.svg"} width={23} height={23} alt="" /></button>
    </div>
    {help && <p id={help} className={styles.help}>Use pelo menos 8 caracteres.</p>}
    {error && <p id={`${name}-error`} className={styles.fieldError}>{error}</p>}
  </div>;
}
