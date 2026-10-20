import Link from "next/link";
import styles from "./home.module.css";

export default function StartTestButton() {
  return <Link href="/quiz" className={styles.startButton}>Começar teste grátis</Link>;
}
