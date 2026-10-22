import Image from "next/image";
import Link from "next/link";
import type {premiumOffer} from "@/lib/subscriptions/contract";
import {studyAreas} from "@/lib/premium-study/contract";
import {checkoutEnabled} from "@/lib/subscriptions/checkout-launch";
import CheckoutAction from "./checkout-action";
import CheckoutObserver from "./checkout-observer";
import {checkoutVariant} from "./checkout-events";
import styles from "./checkout.module.css";

export default function CheckoutOffer({offer,preview=false}:{offer:ReturnType<typeof premiumOffer>;preview?:boolean}) {
  const money=(value:number)=>value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  return <main className={styles.checkout} data-checkout-variant={checkoutVariant}>
    {!preview&&<CheckoutObserver/>}
    <header className={styles.heading}><h1>Mais prática. Mais direção.</h1><p>Questões sem limite diário, simulados e um plano para organizar sua preparação para ETEC e IF.</p></header>
    <div className={styles.layout}>
      <aside className={styles.summary} aria-labelledby="payment-title" id="resumo">
        <h2 id="payment-title">Seu Premium</h2>
        <p className={styles.price}>{money(offer.monthlyPrice)}<span>por mês, desde a primeira cobrança</span></p>
        <dl className={styles.breakdown}><div><dt>Assinatura mensal</dt><dd>{money(offer.monthlyPrice)}</dd></div><div><dt>Taxa de serviço Cakto</dt><dd>R$ 0,99</dd></div><div className={styles.total}><dt>Total por mês</dt><dd>{money(offer.monthlyPrice+.99)}</dd></div></dl>
        <p className={styles.renewal}>Renovação mensal até o cancelamento. Confira e autorize a forma de pagamento na Cakto.</p>
        {checkoutEnabled&&!preview?<CheckoutAction mobileSummary total={money(offer.monthlyPrice+.99)}/>:<button className={styles.disabled} disabled>{preview?"Contratação indisponível na prévia":"Premium em breve"}</button>}
        <p className={styles.handoff}>Você continua no checkout da Cakto para escolher Pix ou cartão e concluir. Nenhuma cobrança é feita nesta página.</p>
        <div className={styles.trust}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>Dados do cartão tratados pela Cakto.</span></div>
        <div className={styles.faq} aria-label="Dúvidas sobre a assinatura">
          <details data-checkout-faq="renewal"><summary>Como funciona a renovação?</summary><p>O plano é mensal. Cartão e Pix Automático permitem cobranças recorrentes conforme a autorização no checkout. No Pix comum, siga as instruções de renovação da Cakto. O acesso acompanha os pagamentos confirmados.</p></details>
          <details data-checkout-faq="cancel"><summary>Como cancelo a assinatura?</summary><p>Solicite o cancelamento de futuras renovações pelo <Link href="/suporte">suporte da Meta Aprovação</Link>, informando o e-mail da compra e a referência do pedido. Cancelamento e reembolso são pedidos diferentes. Consulte as condições nos <Link href="/termos">termos de uso</Link>.</p></details>
          <details data-checkout-faq="access"><summary>Quando o Premium é liberado?</summary><p>Após a confirmação e vinculação do pagamento à sua conta. Use na Cakto o mesmo e-mail da Meta Aprovação. Se já pagou e o acesso ainda não apareceu, fale com o suporte antes de pagar novamente.</p></details>
        </div>
        <p className={styles.responsible}>Menor de idade? Faça a contratação com seu responsável.</p>
        <p className={styles.legal}><Link href="/termos">Termos de uso</Link><Link href="/privacidade">Privacidade</Link><Link href="/suporte">Preciso de ajuda</Link></p>
      </aside>
      <div className={styles.story}>
        <section aria-labelledby="benefits-title"><h2 id="benefits-title">Um próximo passo para cada estudo.</h2>
          <ul className={styles.benefits}>
            <li><strong>Pratique no seu ritmo</strong><p>Questões e simulados sem limite diário, com correção e explicações.</p></li>
            <li><strong>Saiba o que revisar</strong><p>Diagnóstico, radar e revisão com flashcards ajudam a identificar suas prioridades.</p></li>
            <li><strong>Transforme metas em rotina</strong><p>Plano adaptável, calendário e sessões de estudo organizadas em um só lugar.</p></li>
            <li><strong>Treine para a sua prova</strong><p>Simulados realistas e personalizados, além da biblioteca de provas e gabaritos oficiais.</p></li>
          </ul>
          <details className={styles.resources} data-checkout-faq="resources"><summary>Ver todos os recursos incluídos</summary><ul><li>Tudo do Gratuito</li><li>Questões sem limite diário</li><li>Simulados sem limite diário</li><li>Simulados por matéria</li>{Object.values(studyAreas).map(name=><li key={name}>{name}</li>)}</ul></details>
        </section>
        <section className={styles.preview} aria-labelledby="preview-title"><h2 id="preview-title">Veja a revisão por dentro.</h2><p>Uma questão, a explicação e a próxima revisão no seu tempo.</p><figure><Image src="/images/premium-review-card.png" alt="Cartão real da revisão: questão de Geografia sobre escala de mapas, alternativas e controle para revelar a resposta." width={736} height={512} sizes="(max-width: 959px) 90vw, 500px"/><figcaption>Interface real da Meta Aprovação. O conteúdo varia conforme seus estudos.</figcaption></figure><Link href="/quiz" data-checkout-preview>Experimentar uma questão gratuitamente</Link></section>
        <section className={styles.compare} aria-labelledby="compare-title"><h2 id="compare-title">O que muda no Premium?</h2><dl><div><dt>Gratuito · R$ 0</dt><dd>10 questões por dia e 1 simulado rápido por dia. Correção, histórico e estatísticas incluídos.</dd></div><div><dt>Premium</dt><dd>Tudo do Gratuito, sem limite diário de questões e simulados, com os recursos de planejamento, revisão e organização.</dd></div></dl><Link href="/dashboard">Continuar no Gratuito</Link></section>
        <details className={styles.extraFaq} data-checkout-faq="refund"><summary>E se eu precisar de reembolso?</summary><p>Fale com o <Link href="/suporte">suporte</Link> usando o e-mail da compra e a referência do pedido. Os direitos e as condições aplicáveis estão nos <Link href="/termos">termos de uso</Link>. Não envie senha ou dados completos de cartão.</p></details>
      </div>
    </div>
  </main>;
}
