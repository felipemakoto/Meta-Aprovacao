import Image from "next/image";
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
      </header>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Como está sua <mark className={styles.highlight}>preparação</mark> para a ETEC e os IFs?
        </h1>
        <p className={styles.intro}>
          Faça um teste rápido e descubra quais conteúdos você precisa revisar.
        </p>
        <StartTestButton />
      </main>
      <footer className={styles.footer}>
        <p className={styles.explanation}>
          Ao final, veja seus acertos e a explicação de cada questão.
        </p>
        <p className={styles.disclaimer}>
          Diagnóstico inicial, sem promessa de aprovação.
        </p>
      </footer>
    </div>
  );
}
