import Link from "next/link";
import type { DashboardSummary } from "@/lib/quiz/dashboard-contract";
import StudyShell, { StudyIcon } from "../study-shell";
import styles from "./dashboard.module.css";

export default function Dashboard({ summary, preview = false, activity = null }: { summary: DashboardSummary | null; preview?: boolean; activity?: { answered: number; correct: number; simulations: number } | null }) {
  const latest = summary?.latest;
  const resultPath = preview ? "/quiz/result/preview" : "/quiz/result/saved";
  const route = (path: string) => path + (preview ? "/preview" : "");
  const date = latest ? new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date(latest.completedAt)) : "";
  return <StudyShell active="dashboard" preview={preview}>
    <main className={styles.page}>
      <h1 className={styles.title}>Seus estudos</h1>
      <p className={styles.intro}>Questões, simulados e respostas para revisar.</p>
      {summary === null ? <section className={styles.card} aria-labelledby="dashboard-error">
        <h2 id="dashboard-error" className={styles.cardTitle}>Não foi possível carregar seus estudos</h2>
        <p className={styles.message}>Seus resultados continuam salvos. Tente novamente em alguns instantes.</p>
        <a className={styles.primary} href={route("/dashboard")}>Tentar novamente</a>
      </section> : <div className={styles.overview}>
        {latest ? <section className={styles.card} aria-labelledby="last-test">
          <div className={styles.cardHeading}><h2 id="last-test" className={styles.cardTitle}>Último teste</h2><time className={styles.date} dateTime={latest.completedAt}>{date}</time></div>
          <p className={styles.score}><strong>{latest.score} de {latest.total}</strong><span>acertos</span></p>
          <progress className={styles.progress} value={latest.score} max={latest.total} aria-label="Acertos no último teste" aria-valuetext={`${latest.score} de ${latest.total} acertos`} />
          <p className={styles.message}>{latest.score === latest.total ? "Você acertou todas as questões." : `${latest.total - latest.score} ${latest.total - latest.score === 1 ? "questão para revisar." : "questões para revisar."}`}</p>
          <div className={styles.cardActions}>
            <Link className={styles.primary} href={`${resultPath}?review=${latest.score === latest.total ? "all" : "errors"}${preview ? `&score=${latest.score}` : ""}`}>{latest.score === latest.total ? "Revisar respostas" : "Revisar erros"}</Link>
            <Link className={styles.secondary} href={`${resultPath}${preview ? `?score=${latest.score}` : ""}`}>Ver resultado completo</Link>
          </div>
        </section> : <section className={styles.card} aria-labelledby="first-test">
          <h2 id="first-test" className={styles.cardTitle}>Ainda não há um teste salvo</h2>
          <p className={styles.message}>Faça o teste e salve o resultado para revisar depois.</p>
          <div className={styles.cardActions}><Link className={styles.primary} href="/quiz">Fazer o teste gratuito</Link><Link className={styles.secondary} href="/quiz/result">Já terminei um teste</Link></div>
        </section>}
        <section className={styles.activity} aria-labelledby="activity-title">
          <h2 id="activity-title" className={styles.cardTitle}>Sua atividade</h2>
          <dl>
            <div><dt>Respostas registradas</dt><dd>{activity?.answered.toLocaleString("pt-BR") ?? "Indisponível"}</dd></div>
            <div><dt>Acertos</dt><dd>{activity?.correct.toLocaleString("pt-BR") ?? "Indisponível"}</dd></div>
            <div><dt>Simulados concluídos</dt><dd>{activity?.simulations.toLocaleString("pt-BR") ?? "Indisponível"}</dd></div>
          </dl>
          <Link className={styles.textLink} href={route("/estatisticas")}>Ver estatísticas</Link>
        </section>
      </div>}
      <section className={styles.materials} aria-labelledby="materials-title">
        <div className={styles.sectionHeading}><h2 id="materials-title">Seus materiais</h2><Link className={styles.textLink} href={route("/historico")}>Abrir histórico</Link></div>
        <div className={styles.materialGrid}>
          <Link className={styles.material} href={route("/questoes")}><span className={styles.materialArt}><StudyIcon name="questions" /></span><h3>Questões para praticar</h3><p>Escolha a matéria e o assunto. Aprenda com a correção.</p><span className={styles.materialAction}>Praticar questões</span></Link>
          <Link className={styles.material} href={route("/simulados")}><span className={`${styles.materialArt} ${styles.simulationArt}`}><StudyIcon name="simulations" /></span><h3>Simulados</h3><p>Responda no seu ritmo e confira o resultado ao finalizar.</p><span className={styles.materialAction}>Ver simulados</span></Link>
        </div>
      </section>
      <p className={styles.footer}>{preview ? "Dados ilustrativos." : "Testes salvos, questões praticadas e simulados concluídos."}</p>
    </main>
  </StudyShell>;
}
