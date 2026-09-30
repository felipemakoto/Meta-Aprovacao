"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { validateSignup, type SignupErrors, type SignupInput } from "@/lib/auth/signup-contract";
import styles from "./signup.module.css";

const messages: Record<string, string> = {
  rate_limited: "Muitas tentativas ou limite de e-mails atingido. Aguarde antes de tentar novamente.",
  weak_password: "Essa senha não foi aceita. Escolha uma senha mais forte e diferente de senhas conhecidas.",
  invalid_input: "Confira o e-mail e as senhas antes de enviar.",
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
    const input: SignupInput = { email: String(data.get("email") ?? ""), password: String(data.get("password") ?? ""), confirmPassword: String(data.get("confirmPassword") ?? "") };
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
      <p>Se o endereço puder receber um cadastro, você receberá um link de confirmação. Confira também a pasta de spam.</p>
      <p>Abra o link neste mesmo navegador, onde iniciou o cadastro.</p>
      <p>Se já possui uma conta, sua senha permanece a mesma.</p>
    </div>
    <Link className={styles.skip} href="/">Voltar ao início</Link>
  </section>;
  return <section>
    <h1 className={styles.title}>Criar conta</h1>
    <form className={styles.panel} onSubmit={submit} noValidate aria-busy={busy}>
      <fieldset disabled={busy} className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="signup-email">E-mail</label>
          <input id="signup-email" name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} placeholder="voce@exemplo.com" aria-invalid={!!fields.email} aria-describedby={fields.email ? "email-error" : undefined} />
          {fields.email && <p id="email-error" className={styles.fieldError}>{fields.email}</p>}
        </div>
        <PasswordField name="password" label="Senha" placeholder="Crie uma senha" error={fields.password} />
        <PasswordField name="confirmPassword" label="Confirmar senha" placeholder="Repita a senha" error={fields.confirmPassword} />
        {error && <div ref={status} tabIndex={-1} role="alert" className={styles.error}>{error}{activeSession && <Link href="/cadastro/confirmado">Ver estado da conta</Link>}</div>}
        <button type="submit" className={styles.submit}>{busy ? "Criando conta…" : "Criar conta"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></button>
      </fieldset>
      <noscript>Ative o JavaScript para usar o formulário de cadastro.</noscript>
    </form>
    <p className={styles.note}>Enviaremos um link para confirmar seu e-mail.</p>
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
