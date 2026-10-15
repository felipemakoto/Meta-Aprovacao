import Image from "next/image";
import Link from "next/link";
import type {premiumOffer} from "@/lib/subscriptions/contract";
import styles from "./plan-options.module.css";
import ContinueStudy from "./continue-study";

export default function PlanOptions({offer,active=false,preview=false,onboarding=false}:{offer:ReturnType<typeof premiumOffer>;active?:boolean;preview?:boolean;onboarding?:boolean}) {
  const money=(value:number)=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const study=preview?"/simulados/preview":"/simulados";
  return <div className={styles.plans} aria-label="Planos disponíveis">
    <section className={styles.plan} aria-labelledby="free-plan-title">
      <p className={styles.label}>Para começar</p><h2 id="free-plan-title">Gratuito</h2>
      <p className={styles.price}>R$ 0<span>sem mensalidade</span></p>
      <ul><li>10 questões por dia</li><li>1 simulado rápido por dia</li></ul>
      {onboarding&&!preview?<ContinueStudy/>:<Link className={styles.primary} href={study}>{onboarding?"Fazer meu simulado grátis":"Continuar estudando"}<Image src="/icons/arrow-right.svg" width={21} height={21} alt=""/></Link>}
      <p className={styles.note}>Sem cartão.</p>
    </section>
    <section className={`${styles.plan} ${styles.premium}`} aria-labelledby="premium-plan-title">
      <p className={styles.label}>{active?"Seu plano está ativo":"Para ir além"}</p><h2 id="premium-plan-title">Premium</h2>
      <p className={styles.price}>{money(active?offer.monthlyPrice+.99:offer.firstPrice+.99)}<span>{!active&&offer.promotional?"no primeiro mês":"por mês"}</span></p>
      {!active&&offer.promotional&&<p className={styles.renewal}>Depois, {money(offer.monthlyPrice+.99)}/mês.</p>}
      <ul><li>Questões sem limite diário</li><li>Simulados sem limite diário</li><li>Simulados por matéria</li><li>Todo o catálogo Premium</li><li>Correção com explicações</li><li>Histórico de respostas</li><li>Estatísticas de desempenho</li></ul>
      {active?<Link className={styles.primary} href={study}>Continuar no Premium<Image src="/icons/arrow-right.svg" width={21} height={21} alt=""/></Link>:<button className={styles.secondary} disabled aria-describedby="premium-coming">Premium em breve</button>}
      <p className={styles.note}>{active?"Taxa Cakto incluída.":<>Taxa Cakto de R$ 0,99 incluída.{offer.promotional&&<> Cupom <strong>primeiracompra</strong> até 31/10/2026.</>}</>}</p>
      {!active&&<p className={styles.note} id="premium-coming">Assinatura mensal. Contratação ainda indisponível.</p>}
    </section>
    <p className={styles.shared}>Correção, histórico e estatísticas também estão no gratuito.</p>
  </div>;
}
