import Image from "next/image";
import Link from "next/link";
import StartTestButton from "./start-test-button";
import { HomeIcon, MetaMark } from "./home-art";
import theme from "./home-theme.module.css";
import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={`${theme.homeTheme} ${styles.page}`}>
      <a className={styles.skipLink} href="#conteudo">Pular para o conteúdo</a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/" aria-label="Meta Aprovação — início">
            <MetaMark />
            <span><span className={styles.brandName}>Meta Aprovação</span><span className={styles.brandContext}>ETEC / IFSP</span></span>
          </Link>
          <nav className={styles.desktopNav} aria-label="Navegação principal">
            <a href="#como-funciona">Como funciona</a><Link href="/questoes">Questões</Link><Link href="/simulados">Simulados</Link><Link href="/login">Entrar</Link><Link className={styles.outlineButton} href="/cadastro">Criar conta</Link>
          </nav>
          <details className={styles.mobileMenu}>
            <summary>Menu<span aria-hidden="true"><span /><span /></span></summary>
            <nav aria-label="Navegação principal no celular"><a href="#como-funciona">Como funciona</a><Link href="/questoes">Questões</Link><Link href="/simulados">Simulados</Link><Link href="/login">Entrar</Link><Link href="/cadastro">Criar conta</Link></nav>
          </details>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <h1 id="home-title" className={styles.title}>Aprenda resolvendo.<br />Prepare-se para a ETEC e o IF.</h1>
              <p className={styles.intro}>Questões, simulados e explicações para descobrir o que reforçar e continuar estudando.</p>
              <StartTestButton />
            </div>
            <figure className={styles.example}>
              <figcaption>Exemplo de questão</figcaption>
              <p className={styles.exampleQuestion}>Uma mochila custa R$ 80,00.<br />Com 15% de desconto, quanto ela custa?</p>
              <div className={styles.priceBar} aria-label="15% de desconto equivalem a R$ 12,00; os 85% restantes equivalem a R$ 68,00."><span>15%</span><span>85%</span></div>
              <div className={styles.priceLegend} aria-hidden="true"><span>Desconto: R$ 12,00</span><span>Restante: R$ 68,00</span></div>
              <p className={styles.originalPrice}>Preço original: R$ 80,00</p>
              <p className={styles.answer}><span>Resposta</span><strong>R$ 68,00</strong></p>
              <p className={styles.calculation}>Cálculo: 80 − 12 = 68</p>
              <span className={styles.exampleGeometry} aria-hidden="true"><HomeIcon name="math" size={76} /></span>
            </figure>
          </div>
        </section>
        <section className={styles.benefits} aria-labelledby="benefits-title">
          <div className={styles.contentWidth}>
            <h2 id="benefits-title" className={styles.sectionTitle}>Mais clareza a cada questão</h2>
            <ul className={styles.benefitList}>
              <li><HomeIcon name="checklist" size={92} /><h3>Entenda seus erros</h3><p>Confira a correção com explicações.</p></li>
              <li><HomeIcon name="chart" size={92} /><h3>Acompanhe sua evolução</h3><p>Consulte seu histórico e suas estatísticas.</p></li>
              <li><HomeIcon name="calendar" size={92} /><h3>Estude no seu ritmo</h3><p>Pratique um pouco por dia e retome seus estudos.</p></li>
            </ul>
          </div>
        </section>
        <section id="como-funciona" className={styles.process} aria-labelledby="process-title">
          <div className={styles.contentWidth}>
            <h2 id="process-title" className={styles.sectionTitle}>Um começo simples. Um próximo passo claro.</h2>
            <ol className={styles.steps}>
              <li><div className={styles.stepArt}><span aria-hidden="true">1</span><HomeIcon name="pencil" size={64} /></div><h3>Faça o diagnóstico</h3><p>Responda às 10 questões iniciais.</p></li>
              <li><div className={styles.stepArt}><span aria-hidden="true">2</span><HomeIcon name="chart" size={64} /></div><h3>Veja o que reforçar</h3><p>Confira seus resultados por matéria.</p></li>
              <li><div className={styles.stepArt}><span aria-hidden="true">3</span><HomeIcon name="target" size={64} /></div><h3>Continue praticando</h3><p>Resolva questões e experimente um simulado.</p></li>
            </ol>
          </div>
        </section>
        <section className={styles.catalog} aria-labelledby="catalog-title">
          <div className={styles.contentWidth}>
            <h2 id="catalog-title" className={styles.sectionTitle}>Pratique para a sua próxima prova.</h2>
            <ul className={styles.subjects} aria-label="Matérias disponíveis">
              <li><HomeIcon name="math" size={40} />Matemática</li><li><HomeIcon name="book" size={40} />Português</li><li><HomeIcon name="science" size={40} />Ciências</li><li><HomeIcon name="history" size={40} />História</li><li><HomeIcon name="geography" size={40} />Geografia</li>
            </ul>
            <div className={styles.studyOptions}>
              <article><span className={styles.studyArt}><HomeIcon name="checklist" size={100} /></span><div><h3>Questões para praticar</h3><p>Escolha a matéria e revise com explicações.</p><Link className={styles.primaryButton} href="/questoes">Explorar questões<HomeIcon name="arrow" size={20} /></Link></div></article>
              <article><span className={styles.studyArt}><HomeIcon name="timer" size={100} /></span><div><h3>Simulado rápido</h3><p>10 questões para colocar seus conhecimentos em prática.</p><Link className={styles.primaryButton} href="/simulados">Ver simulados<HomeIcon name="arrow" size={20} /></Link></div></article>
            </div>
          </div>
        </section>
        <section className={styles.signup} aria-labelledby="signup-title">
          <div className={styles.signupInner}>
            <div className={styles.signupCopy}><h2 id="signup-title" className={styles.sectionTitle}>Seu próximo passo começa com uma questão.</h2><p>Crie sua conta e continue seus estudos no gratuito.</p><Link className={styles.primaryButton} href="/cadastro">Criar conta grátis</Link><p className={styles.limits}>10 questões por dia e 1 simulado rápido por dia.</p></div>
            <Image className={styles.journey} src="/images/meta-study-path.png" width={1774} height={887} sizes="(max-width: 719px) 100vw, 50vw" alt="" />
          </div>
          <div className={styles.helpRow}><p>Diagnóstico inicial, sem promessa de aprovação.</p><Link href="/suporte">Precisa de ajuda? Fale com o suporte</Link></div>
        </section>
      </main>
    </div>
  );
}
