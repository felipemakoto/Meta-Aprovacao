import Link from "next/link";
import StartTestButton from "./start-test-button";
import { HomeIcon, MetaMark, StudyArtwork } from "./home-art";
import theme from "./home-theme.module.css";
import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={`${theme.homeTheme} ${styles.page}`}>
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label="Meta Aprovação — início">
            <MetaMark /><span className={styles.brandName}>Meta Aprovação</span>
          </Link>
          <nav className={styles.desktopNav} aria-label="Navegação principal">
            <Link href="/questoes">Questões</Link><Link href="/simulados">Simulados</Link>
            <Link href="/login">Entrar</Link><Link className={styles.outlineButton} href="/cadastro">Criar conta</Link>
          </nav>
          <details className={styles.mobileMenu}>
            <summary>Menu<span aria-hidden="true"><span /><span /></span></summary>
            <nav aria-label="Navegação principal no celular">
              <Link href="/questoes">Questões</Link><Link href="/simulados">Simulados</Link>
              <Link href="/login">Entrar</Link><Link href="/cadastro">Criar conta</Link>
            </nav>
          </details>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <h1 id="home-title" className={styles.title}>Mais prática.<br />Mais preparo.</h1>
            <p className={styles.intro}>Seus estudos para a ETEC e o IF.</p>
            <StartTestButton />
          </div>
          <div className={styles.artwork}><StudyArtwork /></div>
        </section>
        <section className={styles.practice} aria-labelledby="practice-title">
          <h2 id="practice-title">O que vamos estudar hoje?</h2>
          <div className={styles.studyOptions}>
            <Link href="/questoes"><HomeIcon name="book" /><span>Resolver questões</span><HomeIcon name="arrow" /></Link>
            <Link href="/simulados"><HomeIcon name="timer" /><span>Fazer um simulado</span><HomeIcon name="arrow" /></Link>
          </div>
          <ul className={styles.subjects} aria-label="Matérias disponíveis">
            <li>Matemática</li><li>Português</li><li>Ciências</li><li>História</li><li>Geografia</li>
          </ul>
        </section>
        <section className={styles.method} aria-labelledby="method-title">
          <h2 id="method-title">Da primeira questão à sua evolução.</h2>
          <ol className={styles.steps}>
            <li><span className={styles.stepNumber} aria-hidden="true">1</span><div><h3>Descubra por onde começar.</h3><p>Um diagnóstico de 10 questões para ver o que reforçar.</p></div></li>
            <li><span className={styles.stepNumber} aria-hidden="true">2</span><div><h3>Pratique e entenda.</h3><p>Questões e simulados com correção explicada.</p></div></li>
            <li><span className={styles.stepNumber} aria-hidden="true">3</span><div><h3>Acompanhe sua evolução.</h3><p>Seu histórico e suas estatísticas, sempre à mão.</p></div></li>
          </ol>
        </section>
        <section className={styles.signup} aria-labelledby="signup-title">
          <div className={styles.signupInner}>
            <div><h2 id="signup-title">Sua rotina começa no gratuito.</h2><p className={styles.freePlan}>10 questões por dia e 1 simulado rápido por dia.<br />Correção, histórico e estatísticas incluídos.</p></div>
            <Link className={styles.primaryButton} href="/cadastro">Criar conta grátis</Link>
          </div>
        </section>
        <div className={styles.helpRow}><Link href="/suporte">Falar com o suporte</Link></div>
      </main>
    </div>
  );
}
