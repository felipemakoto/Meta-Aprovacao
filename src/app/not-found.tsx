import Link from "next/link";
import Image from "next/image";
import entry from "./entry.module.css";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={entry.page}>
      <header className={entry.header}>
        <Link href="/" className={styles.brand} aria-label="ETEC / IF — início">
          <span className={entry.brandMark} aria-hidden="true">
            <Image className={entry.whiteIcon} src="/icons/arrow-up-right.svg" width={22} height={22} alt="" />
          </span>
          <span className={entry.brandName}>ETEC / IF</span>
        </Link>
      </header>
      <section className={entry.main} aria-labelledby="missing-page-title">
        <h1 id="missing-page-title" className={entry.title}>Não encontramos esta página.</h1>
        <p className={entry.intro}>O endereço pode estar incorreto ou a página ter mudado.</p>
        <nav className={styles.actions} aria-label="Continuar no site">
          <Link href="/" className={`${entry.startButton} ${styles.primary}`}>Voltar ao início</Link>
          <Link href="/dashboard" className={styles.secondary}>Ir para meus estudos</Link>
        </nav>
      </section>
    </main>
  );
}
