import Link from "next/link";
import styles from "./home.module.css";

export default function StartTestButton() {
  return (
    <div className={styles.actions}>
      <div className={styles.actionButtons}>
      <Link href="/quiz" className={styles.startButton}>
        Começar teste grátis
      </Link>
      <Link href="/cadastro" className={styles.secondaryButton}>Criar conta</Link>
      </div>
      <p className={styles.reassurance}>10 questões para começar. Sem cadastro. Sem cartão.</p>
    </div>
  );
}
