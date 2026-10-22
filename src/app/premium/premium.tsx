import Link from "next/link";
import type {PremiumState,premiumOffer} from "@/lib/subscriptions/contract";
import PlanOptions from "./plan-options";
import CheckoutOffer from "./checkout-offer";
import StudyShell from "../study-shell";
import styles from "./premium.module.css";

export default function Premium({state,offer,preview=false}:{state:Exclude<PremiumState,{kind:"login"}>;offer:ReturnType<typeof premiumOffer>;preview?:boolean}) {
  const active=state.kind==="ready"&&state.access.hasPremium;
  if(state.kind==="ready"&&!active)return <StudyShell focus preview={preview}><CheckoutOffer offer={offer} preview={preview}/></StudyShell>;
  return <StudyShell focus menu preview={preview}><div className={styles.page}>
    <main><h1 className={styles.title}>Escolha seu plano</h1><p className={styles.note}>Comece grátis. Amplie quando precisar.</p>
      {state.kind==="error"?<section className={styles.status}><p role="alert">Não foi possível consultar seu plano.</p><Link href="/premium">Tentar novamente</Link></section>:<>
        {active&&<p className={styles.note}>Premium ativo até {new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeZone:"America/Sao_Paulo"}).format(new Date(state.access.accessUntil!))}.</p>}
        <PlanOptions offer={offer} active={active} preview={preview}/>
      </>}
    </main>{preview&&<footer className={styles.footer}>Prévia ilustrativa. Nenhuma cobrança é criada.</footer>}
  </div></StudyShell>;
}
