import Link from "next/link";
import styles from "./information.module.css";
import {AnalyticsPreferences} from "./analytics";

export default function SiteFooter() {
  return <footer className={styles.footer}>
    <p>Meta Aprovação · Preparação independente para ETEC e IFSP.</p>
    <Link className={styles.homeFooterSupport} data-home-support href="/suporte">Falar com o suporte</Link>
    <nav aria-label="Informações legais"><Link href="/termos">Termos de uso</Link><span aria-hidden="true">·</span><Link href="/privacidade">Privacidade</Link><span aria-hidden="true">·</span><AnalyticsPreferences/></nav>
  </footer>;
}
