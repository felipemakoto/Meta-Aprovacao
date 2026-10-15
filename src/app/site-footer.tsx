import Link from "next/link";
import styles from "./information.module.css";

export default function SiteFooter() {
  return <footer className={styles.footer}>
    <nav aria-label="Ajuda e informações"><Link href="/suporte">Suporte</Link><Link href="/privacidade">Privacidade</Link><Link href="/termos">Termos</Link></nav>
    <p>Meta Aprovação · Preparação independente para ETEC e IFSP.</p>
  </footer>;
}
