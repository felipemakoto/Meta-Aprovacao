import type { PracticeReview as Review } from "@/lib/quiz/history-contract";
import { subjects } from "@/lib/quiz/practice-contract";
import styles from "./history.module.css";
export default function PracticeReview({review}:{review:Review}) {
 return <section className={styles.detail}>
 <p className={styles.label}>{subjects[review.subject as keyof typeof subjects] ?? review.subject} · {review.topic}</p>
 <h1 id="practice-review-title" tabIndex={-1} className={styles.title}>Revisão da questão</h1>
 <p>{review.correct?"Você acertou.":"Vamos revisar."}</p>
 <h2 className={styles.score}>{review.statement}</h2>
 <ol type="A" className={styles.options}>{review.options.map((option,i)=><li key={i}>{option}</li>)}</ol>
 <p className={styles.message}>Sua resposta: <strong>{review.answer}</strong> · Correta: <strong>{review.correctAnswer}</strong></p>
 <section className={styles.explanation}><h2>Entenda</h2><p>{review.explanation}</p></section>
 </section>;
}
