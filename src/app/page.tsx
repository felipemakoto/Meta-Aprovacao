import Image from "next/image";
import Link from "next/link";
import StartTestButton from "./start-test-button";
import theme from "./oficina.module.css";
import styles from "./home.module.css";

function StudyIcon({ kind }: { kind: "questions" | "subjects" | "time" | "support" | "next" }) {
  const paths = {
    questions: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h4M9 12h6M9 16h6" /></>,
    subjects: <><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z" /><path d="M12 5v15" /></>,
    time: <><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></>,
    support: <><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H8l-5 2 1.5-5A8.5 8.5 0 1 1 21 11.5Z" /><path d="M7 11h.01M12 11h.01M17 11h.01" /></>,
    next: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export default function Home() {
  return (
    <div className={`${theme.oficina} ${styles.page}`}>
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label="Meta Aprovação — início">
            <span className={styles.brandName}>Meta <span>Aprovação</span></span>
            <span className={styles.brandContext}>ETEC / IF</span>
          </Link>
          <Link className={styles.accountLink} href="/login">Minha conta</Link>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <h1 id="home-title" className={styles.title}>Como está sua preparação para a ETEC e os IFs?</h1>
              <p className={styles.intro}>Dez perguntas para descobrir por onde começar.</p>
              <ul className={styles.testDetails} aria-label="Sobre o teste">
                <li><StudyIcon kind="questions" /><span>10 questões</span></li>
                <li><StudyIcon kind="subjects" /><span>5 matérias</span></li>
                <li><StudyIcon kind="time" /><span>No seu ritmo</span></li>
              </ul>
              <StartTestButton />
            </div>
            <Image className={styles.answerSheet} src="/images/oficina-answer-sheet.svg" width={540} height={570} alt="" priority />
          </div>
        </section>
        <section className={styles.process} aria-labelledby="process-title">
          <div className={styles.contentWidth}>
            <h2 id="process-title" className={styles.processTitle}>Seu primeiro passo</h2>
            <ol className={styles.steps} aria-label="Como funciona">
              <li><span className={styles.stepNumber} aria-hidden="true">1</span><div><h3>Faça o teste</h3><p>Responda às 10 questões no seu ritmo.</p></div><span className={styles.stepArrow}><StudyIcon kind="next" /></span></li>
              <li><span className={styles.stepNumber} aria-hidden="true">2</span><div><h3>Veja o que reforçar</h3><p>Receba um panorama das suas principais áreas.</p></div><span className={styles.stepArrow}><StudyIcon kind="next" /></span></li>
              <li><span className={styles.stepNumber} aria-hidden="true">3</span><div><h3>Continue praticando</h3><p>Use o resultado para focar nos seus estudos.</p></div></li>
            </ol>
          </div>
        </section>
        <section className={styles.guidance} aria-labelledby="guidance-title">
          <div className={styles.guidanceInner}>
            <div>
              <h2 id="guidance-title" className={styles.explanation}>Veja o que estudar. <br />Depois, experimente um simulado.</h2>
              <p className={styles.disclaimer}>Diagnóstico inicial, sem promessa de aprovação.</p>
            </div>
            <Link className={styles.supportLink} href="/suporte">
              <StudyIcon kind="support" />
              <span><strong>Precisa de ajuda?</strong><span>Fale com o suporte</span></span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
