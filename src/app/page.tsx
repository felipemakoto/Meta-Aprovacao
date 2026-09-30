import Image from "next/image";
import Link from "next/link";
import StartTestButton from "./start-test-button";
import styles from "./entry.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brandMark} aria-hidden="true">
          <Image
            className={styles.whiteIcon}
            src="/icons/arrow-up-right.svg"
            width={20}
            height={20}
            alt=""
          />
        </span>
        <span className={styles.brandName}>ETEC / IF</span>
        <Link className={styles.accountLink} href="/login">Minha conta</Link>
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Como está sua <mark className={styles.highlight}>preparação</mark> para a ETEC e os IFs?
        </h1>
        <p className={styles.intro}>
          Responda ao teste e descubra o que revisar.
        </p>
        <StartTestButton />
      </main>
      <footer className={styles.footer}>
        <p className={styles.explanation}>
          Resultado com respostas explicadas.
        </p>
        <p className={styles.disclaimer}>
          Diagnóstico inicial, sem promessa de aprovação.
        </p>
      </footer>
    </div>
  );
}
