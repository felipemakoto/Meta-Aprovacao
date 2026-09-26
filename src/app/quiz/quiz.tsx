"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toPublicQuiz, type GuestQuiz } from "@/lib/quiz/contract";
import type { Answers } from "@/lib/quiz/result-contract";
import { requestResult, ResultRequestError } from "@/lib/quiz/result-client";
import styles from "./quiz.module.css";

type Failure = "unavailable" | "network" | "expired";
type Screen = { kind: "loading" } | { kind: "error"; reason: Failure } | { kind: "ready"; quiz: GuestQuiz };
const subjects: Record<string, string> = { matematica: "Matemática", portugues: "Português", ciencias: "Ciências", historia: "História", geografia: "Geografia" };
// Relógio consultado apenas em efeitos e ações, nunca para decidir o HTML inicial.
function hasExpired(expiresAt: string) { return Date.now() >= Date.parse(expiresAt); }

// Compartilha a criação em andamento inclusive na remontagem do Strict Mode.
let pending: Promise<GuestQuiz | null> | undefined;
function loadQuiz() {
  if (!pending) {
    pending = (async () => {
      const options = { credentials: "same-origin" as const, cache: "no-store" as const, signal: AbortSignal.timeout(15000) };
      let response = await fetch("/api/quiz/attempt", options);
      if (response.status === 401) {
        // Não substituir o cookie de uma tentativa concluída ao voltar ao quiz.
        try { await requestResult(); return null; }
        catch (error) { if (!(error instanceof ResultRequestError) || error.status !== 401) throw error; }
        response = await fetch("/api/quiz/attempt", { ...options, method: "POST" });
      }
      const body = await response.json();
      if (!response.ok) throw new Error(body.error === "quiz_not_ready" ? "unavailable" : "network");
      return toPublicQuiz(body);
    })().finally(() => { pending = undefined; });
  }
  return pending;
}

export default function Quiz({ preview }: { preview?: GuestQuiz }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(preview ? { kind: "ready", quiz: preview } : { kind: "loading" });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (preview) return;
    let active = true;
    loadQuiz().then(
      (quiz) => { if (active) { if (quiz) setScreen({ kind: "ready", quiz }); else router.replace("/quiz/result"); } },
      (error) => { if (active) setScreen({ kind: "error", reason: error.message === "unavailable" ? "unavailable" : "network" }); },
    );
    return () => { active = false; };
  }, [preview, retry, router]);
  function restart() { if (preview) { window.location.reload(); return; } setScreen({ kind: "loading" }); setRetry((value) => value + 1); }
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="ETEC / IF — início">
          <span className={styles.brandMark}><Image src="/icons/arrow-up-right.svg" width={22} height={22} alt="" /></span>ETEC / IF
        </Link>
        <Link className={styles.exit} href="/">Sair</Link>
      </header>
      <main>
        {screen.kind === "loading" && <section className={styles.message} aria-busy="true" role="status"><h1>Preparando seu teste…</h1><p>Buscando as questões da sua tentativa.</p></section>}
        {screen.kind === "error" && (
          <section className={styles.message} role="status">
            <h1>{screen.reason === "expired" ? "O tempo desta tentativa terminou." : screen.reason === "unavailable" ? "O teste está em preparação." : "Não foi possível carregar o teste."}</h1>
            <p>{screen.reason === "expired" ? "Inicie outra tentativa para continuar." : screen.reason === "unavailable" ? "As questões ainda estão em revisão. Volte em breve." : "Confira sua conexão e tente novamente."}</p>
            {screen.reason !== "unavailable" && <button className={styles.continue} onClick={restart}>{screen.reason === "expired" ? "Iniciar outra tentativa" : "Tentar novamente"}</button>}
            <Link className={styles.returnLink} href="/">Voltar ao início</Link>
          </section>
        )}
        {screen.kind === "ready" && <QuizSession key={screen.quiz.id} quiz={screen.quiz} preview={!!preview} onExpire={() => setScreen({ kind: "error", reason: "expired" })} />}
      </main>
      {preview && <p className={styles.previewNotice}>Prévia local de interface. Sem envio de respostas.</p>}
      <noscript><p className={styles.message}>Ative o JavaScript para responder ao quiz.</p></noscript>
    </div>
  );
}

function QuizSession({ quiz, preview, onExpire }: { quiz: GuestQuiz; preview: boolean; onExpire: () => void }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [submission, setSubmission] = useState<"idle" | "sending" | "failed">("idle");
  const sending = useRef(false);
  const submittedAnswers = useRef<Answers | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const question = quiz.questions[index];
  const selected = choices[question.id];
  useEffect(() => {
    const timer = setTimeout(onExpire, Math.max(0, Date.parse(quiz.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [quiz.expiresAt, onExpire]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [index, submission]);
  function stillActive() { if (hasExpired(quiz.expiresAt)) { onExpire(); return false; } return true; }
  async function submit() {
    if (sending.current || !stillActive()) return;
    if (preview) { router.push("/quiz/result/preview"); return; }
    if (!submittedAnswers.current) {
      if (quiz.questions.some(q => !choices[q.id])) return;
      submittedAnswers.current = quiz.questions.map(q => ({ questionId: q.id, answer: choices[q.id] }));
    }
    sending.current = true;
    setSubmission("sending");
    try {
      await requestResult(submittedAnswers.current);
      router.replace("/quiz/result");
    } catch (error) {
      if (error instanceof ResultRequestError && error.status === 401) onExpire();
      else if (error instanceof ResultRequestError && error.status === 409) router.replace("/quiz/result");
      else setSubmission("failed");
    } finally { sending.current = false; }
  }
  function next() {
    if (!selected || !stillActive()) return;
    if (index === quiz.questions.length - 1) void submit(); else setIndex(index + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  if (submission !== "idle") return (
    <section className={styles.message} role="status" aria-busy={submission === "sending"}>
      <h1 ref={heading} tabIndex={-1}>{submission === "sending" ? "Finalizando seu teste…" : "Não foi possível confirmar o envio."}</h1>
      <p>{submission === "sending" ? "Aguarde enquanto suas respostas são corrigidas." : "Tente novamente. Manteremos as mesmas respostas para recuperar seu resultado com segurança."}</p>
      {submission === "failed" && <button className={styles.continue} onClick={() => void submit()}>Tentar novamente</button>}
      <Link className={styles.returnLink} href="/">Voltar ao início</Link>
    </section>
  );
  return (
    <>
      <div className={styles.progressHeading}><span aria-live="polite">Questão {index + 1} de {quiz.questions.length}</span><span>{subjects[question.subject] ?? question.subject}</span></div>
      <progress className={styles.progress} value={index + 1} max={quiz.questions.length} aria-label={`Posição no teste: questão ${index + 1} de ${quiz.questions.length}`} />
      <h1 className={styles.question} id="question-title" ref={heading} tabIndex={-1}>{question.statement}</h1>
      <fieldset className={styles.options} aria-labelledby="question-title">
        <legend className={styles.srOnly}>Escolha uma alternativa</legend>
        {question.options.map((option, position) => {
          const letter = "ABCDE"[position];
          return (
            <label className={styles.option} key={`${question.id}-${letter}`}>
              <input type="radio" name={question.id} value={letter} checked={selected === letter} onChange={() => { if (stillActive()) setChoices({ ...choices, [question.id]: letter }); }} />
              <span className={styles.letter} aria-hidden="true">{letter}</span><span className={styles.srOnly}>Alternativa {letter}: </span><span>{option}</span>
            </label>
          );
        })}
      </fieldset>
      <button className={styles.continue} disabled={!selected} onClick={next}>{index === quiz.questions.length - 1 ? "Finalizar teste" : "Continuar"} <Image src="/icons/arrow-right.svg" width={23} height={23} alt="" /></button>
      {index > 0 && <button className={styles.back} onClick={() => { if (stillActive()) setIndex(index - 1); }}>Questão anterior</button>}
    </>
  );
}
