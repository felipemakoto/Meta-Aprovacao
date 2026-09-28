import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import base from "../quiz/quiz.module.css";
import styles from "./signup.module.css";

export const metadata: Metadata = { title: "Criar conta | ETEC / IF", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${base.page} ${styles.page}`}>
    <header className={base.header}>
      <Link className={base.brand} href="/" aria-label="ETEC / IF — início"><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt="" /></span>ETEC / IF</Link>
      <Link className={base.exit} href="/">Início</Link>
    </header>
    <main className={styles.main}>{children}</main>
  </div>;
}
