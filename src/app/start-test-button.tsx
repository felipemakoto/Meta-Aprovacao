"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./entry.module.css";

export default function StartTestButton() {
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.startButton}
        aria-controls="quiz-availability"
        aria-expanded={showNotice}
        onClick={() => setShowNotice(true)}
      >
        Começar teste grátis
        <Image
          className={styles.whiteIcon}
          src="/icons/arrow-right.svg"
          width={20}
          height={20}
          alt=""
        />
      </button>
      <p className={styles.reassurance}>Sem cadastro. Sem cartão.</p>
      <p id="quiz-availability" role="status" className={showNotice ? styles.notice : undefined}>
        {showNotice
          ? "O teste está em preparação e ainda não pode ser iniciado."
          : null}
      </p>
      <noscript>
        <p className={styles.notice}>O teste está em preparação e ainda não pode ser iniciado.</p>
      </noscript>
    </div>
  );
}
