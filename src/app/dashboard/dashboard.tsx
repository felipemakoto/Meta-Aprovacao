import Image from "next/image";
import Link from "next/link";
import type { DashboardSummary } from "@/lib/quiz/dashboard-contract";
import base from "../quiz/quiz.module.css";
import styles from "./dashboard.module.css";

export default function Dashboard({ summary, preview = false, activity = null }: { summary: DashboardSummary | null; preview?: boolean; activity?:{answered:number;correct:number;simulations:number}|null }) {
  const latest = summary?.latest;
  const resultPath = preview ? "/quiz/result/preview" : "/quiz/result/saved";
  const date = latest ? new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", timeZone: "America/Sao_Paulo" }).format(new Date(latest.completedAt)) : "";
  return <div className={styles.page}>
    <header className={base.header}>
      <Link className={base.brand} href="/" aria-label="ETEC / IF — início"><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt="" /></span>ETEC / IF</Link>
      <Link className={base.exit} href="/login">Minha conta</Link>
    </header>
    <main>
      <h1 className={styles.title}>Seus estudos</h1>
      <nav className={styles.navigation} aria-label="Estudos">
        <Link className={styles.primary} href={preview ? "/questoes/preview" : "/questoes"}>Praticar questões</Link>
        <Link className={styles.secondary} href={preview ? "/historico/preview" : "/historico"}>Histórico</Link>
        <Link className={styles.secondary} href={preview ? "/simulados/preview" : "/simulados"}>Simulados</Link>
        <Link className={styles.secondary} href={preview ? "/estatisticas/preview" : "/estatisticas"}>Estatísticas</Link>
      </nav>
      {summary === null ? <section className={styles.card} aria-labelledby="dashboard-error">
        <h2 id="dashboard-error" className={styles.cardTitle}>Não foi possível carregar seus estudos</h2>
        <p className={styles.message}>Seus resultados continuam salvos. Tente novamente em alguns instantes.</p>
        <a className={styles.primary} href={preview ? "/dashboard/preview" : "/dashboard"}>Tentar novamente</a>
      </section> : <>
        {latest ? <section className={styles.card} aria-labelledby="last-test">
          <h2 id="last-test" className={styles.cardTitle}>Último teste</h2>
          <time className={styles.date} dateTime={latest.completedAt}>{date}</time>
          <p className={styles.score}><strong>{latest.score} de {latest.total}</strong> <span>acertos</span></p>
          <p className={styles.message}>{latest.score === latest.total ? "Você acertou todas as questões." : `${latest.total - latest.score} ${latest.total - latest.score === 1 ? "questão para revisar." : "questões para revisar."}`}</p>
          <Link className={styles.reviewLink} href={`${resultPath}?review=${latest.score === latest.total ? "all" : "errors"}${preview ? `&score=${latest.score}` : ""}`}>{latest.score === latest.total ? "Revisar respostas" : "Revisar erros"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></Link>
          <Link className={styles.secondary} href={`${resultPath}${preview ? `?score=${latest.score}` : ""}`}>Ver resultado completo</Link>
        </section> : <section className={styles.card} aria-labelledby="first-test">
          <h2 id="first-test" className={styles.cardTitle}>Ainda não há um teste salvo</h2>
          <p className={styles.message}>Faça o teste e salve o resultado para revisar depois.</p>
          <Link className={styles.primary} href="/quiz">Fazer o teste gratuito<Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></Link>
          <Link className={styles.secondary} href="/quiz/result">Já terminei um teste</Link>
        </section>}
        <section className={styles.activity} aria-labelledby="activity-title">
          <h2 id="activity-title">Sua atividade</h2>
          <dl>
            <div><dt>Respostas registradas</dt><dd>{activity?.answered.toLocaleString("pt-BR")??"Indisponível"}</dd></div>
            <div><dt>Acertos</dt><dd>{activity?.correct.toLocaleString("pt-BR")??"Indisponível"}</dd></div>
            <div><dt>Simulados concluídos</dt><dd>{activity?.simulations.toLocaleString("pt-BR")??"Indisponível"}</dd></div>
          </dl>
        </section>
      </>}
    </main>
    <footer className={styles.footer}>{preview ? "Dados ilustrativos." : "Testes salvos, questões praticadas e simulados concluídos."}</footer>
  </div>;
}
