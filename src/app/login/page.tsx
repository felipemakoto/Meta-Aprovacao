import { getVerifiedUser } from "@/lib/auth/user";
import { readSubscriptionAccess } from "@/lib/data/subscriptions";
import { parseSubscriptionAccess } from "@/lib/subscriptions/contract";
import LoginForm from "./login-form";
import styles from "../cadastro/signup.module.css";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  let user: Awaited<ReturnType<typeof getVerifiedUser>>;
  try { user = await getVerifiedUser(); } catch {
    return <section><h1 className={styles.title}>Tente novamente</h1><p className={styles.subtitle}>Não foi possível verificar sua sessão agora.</p><a className={styles.skip} href="/login">Tentar novamente</a></section>;
  }
  let showPremiumOffer = false;
  if (user?.email_confirmed_at) {
    try { showPremiumOffer = !parseSubscriptionAccess(await readSubscriptionAccess(user.id)).hasPremium; }
    catch { /* Keep account actions available without assuming a free plan. */ }
  }
  return <LoginForm signedIn={!!user} showPremiumOffer={showPremiumOffer} />;
}
