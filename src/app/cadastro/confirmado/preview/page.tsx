import {notFound} from "next/navigation";
import PlanOptions from "@/app/premium/plan-options";
import {premiumOffer} from "@/lib/subscriptions/contract";
import styles from "../../signup.module.css";
export const dynamic="force-dynamic";
export default function Page() {
  if(process.env.NODE_ENV!=="development")notFound();
  return <section><p className={styles.eyebrow}>E-mail confirmado · Conta pronta</p><h1 className={styles.title}>Como quer continuar?</h1><p className={styles.subtitle}>Seu próximo simulado já pode começar no gratuito.</p><PlanOptions offer={premiumOffer(new Date())} onboarding preview/><p className={styles.note}>Prévia local. Nenhum cadastro ou pagamento é criado.</p></section>;
}
