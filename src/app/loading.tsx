import Image from "next/image";
import styles from "./loading.module.css";

/** Tela de carregamento minimalista exibida pelo Next.js App Router
 *  enquanto as páginas com `force-dynamic` resolvem dados do servidor. */
export default function Loading() {
  return (
    <div className={styles.wrapper} aria-label="Carregando…" role="status">
      <div className={styles.logoWrap}>
        <Image
          src="/icon.svg"
          width={52}
          height={52}
          alt="Meta Aprovação"
          unoptimized
          className={styles.logo}
          priority
        />
        <div className={styles.bar} aria-hidden="true" />
      </div>
    </div>
  );
}
