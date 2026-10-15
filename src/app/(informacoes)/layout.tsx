import Image from "next/image";
import Link from "next/link";
import base from "../quiz/quiz.module.css";
import styles from "../information.module.css";

export default function InformationLayout({children}:{children:React.ReactNode}) {
  return <div className={styles.page}><header className={base.header}>
    <Link className={base.brand} href="/" aria-label="ETEC / IF — início"><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt=""/></span>ETEC / IF</Link>
    <Link className={base.exit} href="/">Início</Link>
  </header><main className={styles.article}>{children}</main></div>;
}
