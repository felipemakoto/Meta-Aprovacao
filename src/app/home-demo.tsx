"use client";

import { useState } from "react";
import styles from "./home.module.css";

export default function HomeDemo() {
  const [answer, setAnswer] = useState<number | null>(null);
  const explanation = answer === 20
    ? "Isso! 80 dividido em 4 partes: 20 em cada uma."
    : answer === null
      ? "25% é uma das quatro partes iguais do total."
      : "Tente de novo: quanto é 80 dividido por 4?";

  return (
    <div className={styles.demo} aria-labelledby="demo-title">
      <h2 id="demo-title">Experimente uma questão.</h2>
      <p className={styles.demoQuestion}>Quanto é 25% de 80?</p>
      <div className={styles.demoVisual} aria-hidden="true">
        <div className={styles.demoBlocks}><span /><span /><span /><span /></div>
        <span className={styles.demoTotal}>80</span>
      </div>
      <div className={styles.demoAnswers} role="group" aria-label="Escolha uma resposta" aria-describedby="demo-explanation">
        {[10, 20, 40].map(value => <button key={value} type="button" aria-pressed={answer === value} className={answer === value ? value === 20 ? styles.correctAnswer : styles.retryAnswer : undefined} onClick={() => setAnswer(value)}>{value}</button>)}
      </div>
      <p className={styles.demoExplanation} id="demo-explanation" role="status">{explanation}</p>
    </div>
  );
}
