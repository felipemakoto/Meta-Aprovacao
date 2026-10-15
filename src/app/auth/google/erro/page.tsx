import Link from "next/link";
import base from "../../../quiz/quiz.module.css";
import styles from "../../../cadastro/signup.module.css";

export const metadata = {title: "Entrada com Google | Meta Aprovação", robots: {index: false, follow: false}, referrer: "no-referrer" as const};
export default function GoogleErrorPage() {
  return <main className={base.page}><section className={base.message}>
    <p className={styles.eyebrow}>Sua conta</p><h1>Vamos tentar de novo?</h1>
    <p>A entrada com Google não foi concluída. Ela pode ter sido cancelada ou o link pode ter expirado.</p>
    <Link href="/cadastro" className={styles.submit}>Voltar ao cadastro</Link>
    <Link href="/login" className={styles.skip}>Já tenho conta</Link>
  </section></main>;
}
