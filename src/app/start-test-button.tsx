import Image from "next/image";
import Link from "next/link";
import styles from "./entry.module.css";

export default function StartTestButton() {
  return (
    <div className={styles.actions}>
      <Link href="/quiz" className={styles.startButton}>
        Começar teste grátis
        <Image className={styles.whiteIcon} src="/icons/arrow-right.svg" width={20} height={20} alt="" />
      </Link>
      <p className={styles.reassurance}>Sem cadastro. Sem cartão.</p>
    </div>
  );
}
