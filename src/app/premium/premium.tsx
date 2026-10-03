import Image from "next/image";
import Link from "next/link";
import type { PremiumState, premiumOffer } from "@/lib/subscriptions/contract";
import base from "../quiz/quiz.module.css";
import history from "../historico/history.module.css";
import styles from "./premium.module.css";
const benefits = ["Questões sem limite diário", "Simulados sem limite diário", "Simulados por matéria", "Acesso ao catálogo Premium"];
export default function Premium({ state, offer, preview = false }: { state: Exclude<PremiumState, { kind: "login" }>; offer: ReturnType<typeof premiumOffer>; preview?: boolean }) {
  const active = state.kind === "ready" && state.access.hasPremium;
  const money = (value: number) => value.toFixed(2).replace(".", ",");
  return <div className={`${base.page} ${styles.page}`}>
    <header className={base.header}><Link className={base.brand} href="/" aria-label="ETEC / IF — início"><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt="" /></span>ETEC / IF</Link></header>
    <main><h1 className={styles.title}>Premium</h1>
      {state.kind === "error" ? <section className={styles.status} aria-label="Consulta indisponível">
        <p role="alert">Não foi possível consultar seu plano. Tente novamente.</p><Link className={history.backLink} href={preview ? "/premium/preview" : "/premium"}>Tentar novamente</Link>
      </section> : <>
        {active ? <section className={styles.status} aria-label="Seu plano"><p>Seu Premium está ativo.</p><p className={styles.note}>Acesso até {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(state.access.accessUntil!))}.</p></section> : <section aria-label="Preço da assinatura">
          {offer.promotional && <p className={styles.promotion}>Outubro · 50% na primeira mensalidade</p>}
          <p className={styles.price}>R${money(offer.firstPrice)}<span className={styles.qualifier}>{offer.promotional ? "no primeiro mês" : "por mês"}</span></p>
          {offer.promotional && <p className={styles.renewal}>Depois, R${money(offer.monthlyPrice)} por mês.</p>}
          <p className={styles.note}>Taxa Cakto de R$0,99 por cobrança.</p>
          <p className={styles.total}>Total: R${money(offer.firstPrice + 0.99)}{offer.promotional ? ` no primeiro mês; depois, R$${money(offer.monthlyPrice + 0.99)}/mês.` : "/mês."}</p>
          {offer.promotional && <p className={styles.deadline}>Oferta até 31/10/2026.</p>}
        </section>}
        <ul className={styles.benefits} aria-label={active ? "Benefícios do plano" : "Benefícios previstos para o Premium"}>{benefits.map(benefit => <li key={benefit}>{benefit}</li>)}</ul>
        {!active && <dl className={styles.comparison} aria-label="Comparação dos planos"><div><dt>Gratuito</dt><dd>10 questões/dia</dd></div><div><dt>Premium</dt><dd>Questões ilimitadas</dd></div></dl>}
        {active ? <Link className={styles.primary} href={preview ? "/dashboard/preview" : "/dashboard"}>Continuar estudando<Image src="/icons/arrow-right.svg" width={22} height={22} alt="" /></Link> : <>
          <button className={styles.primary} type="button" disabled aria-describedby="premium-unavailable">Escolher Premium<Image src="/icons/arrow-right.svg" width={22} height={22} alt="" /></button>
          <p className={styles.note}>Assinatura mensal. Cancele quando quiser.</p>
          <p className={styles.unavailable} id="premium-unavailable">Contratação em breve. Os benefícios Premium ainda não estão disponíveis.</p>
        </>}
      </>}
      <div className={styles.back}><Link className={history.backLink} href={preview ? "/dashboard/preview" : "/dashboard"}><Image className={history.backIcon} src="/icons/arrow-right.svg" width={20} height={20} alt="" />Voltar aos estudos</Link></div>
    </main>
    <footer className={styles.footer}>Histórico, estatísticas e revisão continuam no gratuito.{preview && <p>Prévia ilustrativa. Nenhuma assinatura ou cobrança é criada.</p>}</footer>
  </div>;
}
