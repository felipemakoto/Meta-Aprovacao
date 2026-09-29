import Link from "next/link";
import { hasRecoverySession } from "@/lib/auth/recovery-session";
import RecoveryForm from "../recuperar-senha/recovery-form";
import styles from "../cadastro/signup.module.css";
export const dynamic = "force-dynamic";
export default async function NewPasswordPage() {
  let allowed=false;let unavailable=false;
  try { allowed=await hasRecoverySession(); } catch { unavailable=true; }
  if (allowed) return <RecoveryForm update />;
  return <section><h1 className={styles.title}>{unavailable ? "Tente novamente" : "Solicite um novo link"}</h1><div className={styles.panel}><p>{unavailable ? "Não foi possível verificar o acesso agora. Tente abrir esta página novamente." : "Abra um link de recuperação válido neste mesmo navegador. O acesso para trocar a senha dura 15 minutos após a abertura do link."}</p></div><Link className={styles.skip} href="/recuperar-senha">Solicitar novo link</Link><a className={styles.skip} href={unavailable ? "/nova-senha" : "/login"}>{unavailable ? "Tentar novamente" : "Voltar para entrar"}</a></section>;
}
