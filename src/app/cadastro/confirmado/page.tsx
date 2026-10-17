import Link from "next/link";
import { getVerifiedUser } from "@/lib/auth/user";
import styles from "../signup.module.css";
import PlanOptions from "@/app/premium/plan-options";
import {premiumOffer,parseSubscriptionPricing} from "@/lib/subscriptions/contract";
import {readSubscriptionPricing} from "@/lib/data/subscriptions";
export const dynamic = "force-dynamic";

export default async function ConfirmedPage() {
  let confirmed = false; let unavailable = false;let active=false;let planUnavailable=false;let hasPaidBefore=true;
  try { const user=await getVerifiedUser();confirmed=!!user?.email_confirmed_at;
    if(confirmed&&user)try{const pricing=parseSubscriptionPricing(await readSubscriptionPricing(user.id));active=pricing.hasPremium;hasPaidBefore=pricing.hasPaidBefore;}catch{planUnavailable=true;}
  } catch { unavailable = true; }
  if(confirmed)return <section><p className={styles.eyebrow}>E-mail confirmado · Conta pronta</p><h1 className={styles.title}>Como quer continuar?</h1>
    <p className={styles.subtitle}>Seu próximo simulado já pode começar no gratuito.</p>
    {planUnavailable&&<p role="status" className={styles.subtitle}>Não conseguimos consultar seu plano atual. Seus benefícios serão verificados ao iniciar.</p>}
    <PlanOptions offer={premiumOffer(new Date(),hasPaidBefore)} active={active} onboarding/>
    <Link className={styles.skip} href="/dashboard">Ir para meus estudos</Link>
  </section>;
  return <section>
    <h1 className={styles.title}>{confirmed ? "E-mail confirmado" : unavailable ? "Tente novamente" : "Confirmação pendente"}</h1>
    <div className={styles.panel}>
      <p>{confirmed ? "Sua conta está pronta. Você pode continuar explorando o teste gratuito." : unavailable ? "Não foi possível verificar sua conta agora. Tente abrir esta página novamente em alguns minutos." : "Abra o link de confirmação no mesmo navegador em que iniciou o cadastro."}</p>
    </div>
    <Link className={styles.skip} href="/login">{confirmed ? "Ver minha conta" : "Entrar na conta"}</Link>
    {confirmed && <Link className={styles.skip} href="/quiz/result">Voltar ao resultado do teste para salvar</Link>}
    {confirmed && <Link className={styles.skip} href="/dashboard">Ver meus estudos</Link>}
    <Link className={styles.skip} href="/">Voltar ao início</Link>
  </section>;
}
