import Link from "next/link";
import Image from "next/image";
import StartTestButton from "./start-test-button";
import { HomeIcon, MetaMark } from "./home-art";
import HomeDemo from "./home-demo";
import HomeHeader from "./home-header";
import theme from "./home-theme.module.css";
import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={`${theme.homeTheme} ${styles.page}`}>
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <HomeHeader>
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
      </HomeHeader>
      <main id="conteudo" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="home-title"><div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <h1 id="home-title" className={styles.title}>Seu próximo passo<br />para a ETEC e o IF.</h1>
            <p className={styles.intro}>Entenda cada questão. Pratique com simulados.<br /> Descubra o que reforçar nos seus estudos.</p>
          </div>
          <div className={styles.heroExperience}>
            <HomeDemo />
            <div className={styles.heroActions}><StartTestButton /><Link className={styles.secondaryButton} href="/cadastro">Criar minha conta</Link></div>
          </div>
        </div></section>
        <section className={styles.practice} aria-labelledby="practice-title">
          <h2 id="practice-title">O que vamos estudar hoje?</h2>
          <div className={styles.studyOptions}>
            <Link href="/questoes"><HomeIcon name="book" /><span>Resolver questões</span><HomeIcon name="arrow" /></Link>
            <Link href="/simulados"><HomeIcon name="timer" /><span>Fazer um simulado</span><HomeIcon name="arrow" /></Link>
          </div>
          <div className={styles.learning}>
            <div><h3>Entenda o porquê de cada resposta.</h3><p>Confira a correção com explicações e transforme os erros em pontos para revisar.</p></div>
            <Image className={styles.learningPhoto} src="/images/study-yen-vu.jpg" width={1200} height={800} sizes="(max-width: 719px) 100vw, 50vw" alt="Livros abertos, anotações e materiais organizados em uma mesa de estudo." />
          </div>
        </section>
        <section className={styles.method} aria-labelledby="method-title">
          <h2 id="method-title">Um jeito mais claro de estudar.</h2>
          <div className={styles.methodInner}>
          <Image className={styles.studyPhoto} src="/images/study-julio-lopez.jpg" width={1200} height={800} sizes="(max-width: 719px) 100vw, 50vw" alt="Estudante fazendo anotações no caderno ao lado de um computador." />
          <ol className={styles.steps}>
            <li><span className={styles.stepNumber} aria-hidden="true">1</span><div><h3>Descubra por onde começar.</h3><p>Um diagnóstico de 10 questões para ver o que reforçar.</p></div></li>
            <li><span className={styles.stepNumber} aria-hidden="true">2</span><div><h3>Pratique e entenda.</h3><p>Questões e simulados com correção explicada.</p></div></li>
            <li><span className={styles.stepNumber} aria-hidden="true">3</span><div><h3>Acompanhe sua evolução.</h3><p>Seu histórico e suas estatísticas, sempre à mão.</p></div></li>
          </ol>
          </div>
        </section>
        <section className={styles.signup} aria-labelledby="signup-title">
          <div className={styles.signupInner}>
            <div className={styles.signupCopy}><h2 id="signup-title">Comece no gratuito.</h2><p className={styles.freePlan}>Correção com explicações, histórico e estatísticas para acompanhar seus estudos.</p></div>
            <div className={styles.signupDetails}>
              <ul className={styles.planLimits}><li><strong>10 questões</strong> por dia</li><li><strong>1 simulado rápido</strong> por dia</li></ul>
              <Link className={styles.primaryButton} href="/cadastro">Criar conta grátis</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
