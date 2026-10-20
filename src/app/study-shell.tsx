import type { ReactNode } from "react";
import Link from "next/link";
import { MetaMark } from "./home-art";
import theme from "./home-theme.module.css";
import styles from "./study-shell.module.css";

type StudyArea = "dashboard" | "questions" | "simulations" | "history" | "statistics";
const destinations: { area: StudyArea; href: string; label: string }[] = [
  { area: "dashboard", href: "/dashboard", label: "Meus estudos" },
  { area: "questions", href: "/questoes", label: "Questões" },
  { area: "simulations", href: "/simulados", label: "Simulados" },
  { area: "history", href: "/historico", label: "Histórico" },
  { area: "statistics", href: "/estatisticas", label: "Estatísticas" },
];

export function StudyIcon({ name }: { name: StudyArea }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === "dashboard" && <><path d="m3 10 9-7 9 7v10H3Z" /><path d="M9 20v-7h6v7" /></>}
    {name === "questions" && <><path d="M12 5C8 3 5 3 2 4v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-6-1-10 1ZM12 5v16" /><path d="M5 8h4m6 0h4" /></>}
    {name === "simulations" && <><circle cx="12" cy="14" r="8" /><path d="M9 2h6m-3 0v4m6 0 2-2m-8 6v5l3 2" /></>}
    {name === "history" && <><path d="M3 11a9 9 0 1 1 2 7M3 5v6h6" /><path d="M12 7v6l4 2" /></>}
    {name === "statistics" && <><path d="M4 20V4m0 16h17M8 16v-5m5 5V7m5 9V3" /></>}
  </svg>;
}

export default function StudyShell({ children, active, preview = false, focus = false, menu = false, homeHref = "/login", exit }: { children: ReactNode; active?: StudyArea | "account"; preview?: boolean; focus?: boolean; menu?: boolean; homeHref?: "/" | "/login"; exit?: ReactNode }) {
  const navigation = destinations.map(item => <Link key={item.area} href={item.href + (preview ? "/preview" : "")} aria-current={active === item.area ? "page" : undefined}><StudyIcon name={item.area} />{item.label}</Link>);
  return <div className={`${theme.homeTheme} ${styles.shell}`} data-study data-study-mode={focus ? "focus" : active}>
    <a className={styles.skip} href="#estudo">Pular para o conteúdo</a>
    <header className={styles.topbar}><div className={styles.topbarInner}>
      <Link className={styles.brand} href={homeHref} aria-label={homeHref === "/login" ? "Meta Aprovação — minha conta" : "Meta Aprovação — início"}><MetaMark /><span>Meta Aprovação</span></Link>
      <div className={styles.headerActions}>
        {(!focus || menu) && <details className={`${styles.mobileMenu} ${menu ? styles.headerMenu : ""}`}><summary>{menu ? "Menu" : "Estudos"}<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 8h16M4 16h16" /></svg></summary><nav aria-label={menu ? "Menu principal" : "Navegação de estudos no celular"}>{navigation}<Link href="/login" aria-current={active === "account" ? "page" : undefined}>Minha conta</Link></nav></details>}
        {!menu && <div className={styles.account}>{exit ?? <Link href="/login">Minha conta</Link>}</div>}
      </div>
    </div></header>
    <div className={`${styles.workspace} ${focus ? styles.focusWorkspace : ""}`}>
      {!focus && <aside className={styles.sidebar}><nav aria-label="Navegação de estudos">{navigation}</nav></aside>}
      <div className={styles.content} id="estudo" tabIndex={-1}>{children}</div>
    </div>
  </div>;
}
