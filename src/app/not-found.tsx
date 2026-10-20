import Link from "next/link";
import StudyShell from "./study-shell";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <StudyShell focus menu homeHref="/"><main className={styles.page}>
      <section aria-labelledby="missing-page-title">
        <h1 id="missing-page-title" className={styles.title}>Não encontramos esta página.</h1>
        <p className={styles.intro}>O endereço pode estar incorreto ou a página ter mudado.</p>
        <nav className={styles.actions} aria-label="Continuar no site">
          <Link href="/" className={styles.primary}>Voltar ao início</Link>
          <Link href="/dashboard" className={styles.secondary}>Ir para meus estudos</Link>
        </nav>
      </section>
    </main></StudyShell>
  );
}
