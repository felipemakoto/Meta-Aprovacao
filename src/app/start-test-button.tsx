import Link from "next/link";
import styles from "./home.module.css";

export default function StartTestButton() {
  return (
    <div className={styles.actions}>
      <Link href="/quiz" className={styles.startButton}>
        Começar teste grátis
      </Link>
      <p className={styles.reassurance}>Sem cadastro. Sem cartão.</p>
    </div>
  );
}
