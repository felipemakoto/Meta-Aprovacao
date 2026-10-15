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
        <p className={styles.eyebrow}><span aria-hidden="true" />Seu primeiro passo</p>
        <h1 className={styles.title}>
          Como está sua <mark className={styles.highlight}>preparação</mark> para a ETEC e os IFs?
        </h1>
        <p className={styles.intro}>
          Dez perguntas para descobrir por onde começar.
        </p>
        <ul className={styles.testDetails} aria-label="Sobre o teste"><li>10 questões</li><li>5 matérias</li><li>No seu ritmo</li></ul>
        <StartTestButton />
        <ol className={styles.steps} aria-label="Como funciona"><li><span>01</span>Faça o teste</li><li><span>02</span>Veja o que reforçar</li><li><span>03</span>Continue praticando</li></ol>
      </main>
      <footer className={styles.footer}>
        <p className={styles.explanation}>
          Veja o que estudar. Depois, experimente um simulado.
        </p>
        <p className={styles.disclaimer}>
          Diagnóstico inicial, sem promessa de aprovação.
        </p>
        <Link className={styles.supportLink} href="/suporte"><span className={styles.supportIcon} aria-hidden="true"><svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13v-2a8 8 0 0 1 16 0v2M4 12H3v6h3v-6H4Zm16 0h1v6h-3v-6h2ZM20 18c0 3-3 3-6 3"/><path d="M11 21h3"/></svg></span><span><strong>Precisa de ajuda?</strong><span>Fale com o suporte</span></span><Image src="/icons/arrow-right.svg" width={20} height={20} alt="" /></Link>
      </footer>
    </div>
  );
}
