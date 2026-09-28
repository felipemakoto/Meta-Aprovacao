import Link from "next/link";
import { getVerifiedUser } from "@/lib/auth/user";
import styles from "../signup.module.css";
export const dynamic = "force-dynamic";

export default async function ConfirmedPage() {
  let confirmed = false; let unavailable = false;
  try { confirmed = !!(await getVerifiedUser())?.email_confirmed_at; } catch { unavailable = true; }
  return <section>
    <h1 className={styles.title}>{confirmed ? "E-mail confirmado" : unavailable ? "Tente novamente" : "Confirmação pendente"}</h1>
    <div className={styles.panel}>
      <p>{confirmed ? "Sua conta está pronta. Você pode continuar explorando o teste gratuito." : unavailable ? "Não foi possível verificar sua conta agora. Tente abrir esta página novamente em alguns minutos." : "Abra o link de confirmação no mesmo navegador em que iniciou o cadastro."}</p>
    </div>
    <Link className={styles.skip} href="/login">{confirmed ? "Ver minha conta" : "Entrar na conta"}</Link>
    <Link className={styles.skip} href="/">Voltar ao início</Link>
  </section>;
}
