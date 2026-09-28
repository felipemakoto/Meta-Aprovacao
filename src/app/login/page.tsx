import { getVerifiedUser } from "@/lib/auth/user";
import LoginForm from "./login-form";
import styles from "../cadastro/signup.module.css";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  let signedIn: boolean;
  try { signedIn = !!(await getVerifiedUser()); } catch {
    return <section><h1 className={styles.title}>Tente novamente</h1><p className={styles.subtitle}>Não foi possível verificar sua sessão agora.</p><a className={styles.skip} href="/login">Tentar novamente</a></section>;
  }
  return <LoginForm signedIn={signedIn} />;
}
