"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { QuizResult } from "@/lib/quiz/result-contract";
import { requestResult, ResultRequestError } from "@/lib/quiz/result-client";
import base from "../quiz.module.css";
import styles from "./result.module.css";

const subjects: Record<string,string> = { matematica: "Matemática", portugues: "Português", ciencias: "Ciências", historia: "História", geografia: "Geografia" };
type Screen = { kind: "loading" } | { kind: "ready"; result: QuizResult } | { kind: "error"; expired: boolean };
export default function Result({ preview }: { preview?: QuizResult }) {
  const [screen, setScreen] = useState<Screen>(preview ? { kind: "ready", result: preview } : { kind: "loading" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (preview) return;
    let active = true;
    requestResult().then(result => { if (active) setScreen({ kind: "ready", result }); },
      error => { if (active) setScreen({ kind: "error", expired: error instanceof ResultRequestError && error.status === 401 }); });
    return () => { active = false; };
  }, [preview, retry]);
  return <div className={base.page}>
    <header className={base.header}>
      <Link className={base.brand} href="/" aria-label="ETEC / IF — início"><span className={base.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt="" /></span>ETEC / IF</Link>
      <Link className={base.exit} href="/">Início</Link>
    </header>
    <main>
      {screen.kind === "loading" && <section className={base.message} role="status"><h1>Carregando seu resultado…</h1></section>}
      {screen.kind === "error" && <section className={base.message} role="status">
        <h1>{screen.expired ? "Resultado indisponível." : "Não foi possível carregar o resultado."}</h1>
        <p>{screen.expired ? "Esta tentativa não foi finalizada ou o prazo de acesso terminou." : "Confira sua conexão e tente novamente. Suas respostas não serão reenviadas."}</p>
        {!screen.expired && <button className={base.continue} onClick={() => { setScreen({ kind: "loading" }); setRetry(n => n + 1); }}>Tentar novamente</button>}
        <Link className={base.returnLink} href="/">Voltar ao início</Link>
      </section>}
      {screen.kind === "ready" && <ResultContent result={screen.result} />}
    </main>
    {preview && <p className={styles.preview}>Exemplo de resultado. Dados ilustrativos.</p>}
  </div>;
}

function ResultContent({ result }: { result: QuizResult }) {
  const [review, setReview] = useState<{ mode: "errors" | "all"; index: number } | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const errors = result.questions.filter(q => !q.correct);
  const items = review?.mode === "errors" ? errors : result.questions;
  const question = review ? items[review.index] : null;
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); }, [review]);
  const score = <><strong>{result.score} {result.score === 1 ? "acerto" : "acertos"}</strong> em {result.total} questões</>;
  if (review && question) return <section className={styles.review}>
    <p className={styles.reviewScore}>{result.score} de {result.total} acertos</p>
    <h1 className={styles.reviewTitle} ref={heading} tabIndex={-1}>Revisão {review.mode === "errors" ? "dos erros" : "das respostas"}</h1>
    <div className={styles.position}><span aria-live="polite">{review.mode === "errors" ? `Erro ${review.index + 1} de ${items.length}` : `Questão ${review.index + 1} de ${items.length}`}</span><span>{subjects[question.subject] ?? question.subject}</span></div>
    <progress className={base.progress} value={review.index + 1} max={items.length} aria-label={`Revisão: ${review.index + 1} de ${items.length}`} />
    <h2 className={styles.question}>{question.statement}</h2>
    <p className={styles.original}>Questão {question.position} do teste · {question.correct ? "Você acertou" : "Você errou"}</p>
    <div className={styles.answer}><span>Sua resposta:</span><b className={base.letter}>{question.answer}</b><span>{question.options["ABCDE".indexOf(question.answer)]}</span></div>
    <div className={`${styles.answer} ${styles.correct}`}><span>Correta:</span><b className={base.letter}>{question.correctAnswer}</b><span>{question.options["ABCDE".indexOf(question.correctAnswer)]}</span></div>
    <div className={styles.explanation}><h2>Entenda</h2><p>{question.explanation}</p></div>
    <button className={base.continue} onClick={() => setReview(review.index + 1 < items.length ? { ...review, index: review.index + 1 } : null)}>{review.index + 1 < items.length ? "Próxima explicação" : "Concluir revisão"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></button>
    {review.index > 0 && <button className={base.back} onClick={() => setReview({ ...review, index: review.index - 1 })}>Explicação anterior</button>}
    <button className={styles.secondary} onClick={() => setReview(null)}>Ver resumo</button>
  </section>;
  return <section className={styles.summary}>
    <h1 className={styles.title} ref={heading} tabIndex={-1}>{errors.length ? <>O que <mark>revisar</mark></> : "Seu resultado"}</h1>
    <p className={styles.score}>{score}</p>
    <p className={styles.intro}>{errors.length ? `Você errou ${errors.length} ${errors.length === 1 ? "questão" : "questões"}. ${errors.length === 1 ? "Comece por este conteúdo." : "Comece por estes conteúdos."}` : "Você acertou todas as questões deste teste. Veja as explicações para revisar os conteúdos."}</p>
    {errors.length > 0 && <ol className={styles.topics}>{errors.map((q, index) => <li key={q.id}>
      <button onClick={() => setReview({ mode: "errors", index })} aria-label={`Revisar erro ${index + 1}: ${subjects[q.subject] ?? q.subject}, ${q.topic}`}>
        <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.topic}><span>{subjects[q.subject] ?? q.subject}</span><strong>{q.topic}</strong></span>
        <Image src="/icons/arrow-right.svg" width={25} height={25} alt="" />
      </button>
    </li>)}</ol>}
    <button className={base.continue} onClick={() => setReview({ mode: errors.length ? "errors" : "all", index: 0 })}>{errors.length ? `Revisar ${errors.length === 1 ? "o erro" : `os ${errors.length} erros`}` : "Revisar respostas"}<Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></button>
    {errors.length > 0 && <button className={base.back} onClick={() => setReview({ mode: "all", index: 0 })}>Ver todas as respostas</button>}
  </section>;
}
