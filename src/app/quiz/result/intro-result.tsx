import Image from "next/image";
import Link from "next/link";
import {studyFocus} from "@/lib/quiz/study-focus";
import type {QuizResult} from "@/lib/quiz/result-contract";
import base from "../quiz.module.css";
import styles from "./result.module.css";

const subjects:Record<string,string>={matematica:"Matemática",portugues:"Português",ciencias:"Ciências",historia:"História",geografia:"Geografia"};
export default function IntroResult({result,continueHref="/cadastro"}:{result:QuizResult;continueHref?:string}) {
  const topics=studyFocus(result),missed=result.total-result.score;
  return <section className={styles.summary}>
    <p className={base.stepLabel}>Teste inicial concluído</p>
    <h1 className={styles.title}>{missed?"Seu ponto de partida":"Pronto para o próximo nível?"}</h1>
    <p className={styles.intro}>{missed?`${missed===1?"Uma questão merece":"Algumas questões merecem"} atenção. Comece por estes assuntos.`:"Você acertou todas. Agora experimente questões no nível da prova."}</p>
    {missed>0&&<><h2 className={styles.focusTitle}>O que estudar</h2><ol className={`${styles.topics} ${styles.focusTopics}`}>{topics.map((topic,index)=><li key={JSON.stringify([topic.subject,topic.topic])}>
      <span className={styles.number} aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
      <div className={styles.topic}><span>{subjects[topic.subject]??topic.subject}</span><strong>{topic.topic}</strong><small>{topic.positions.length===1?"Errou a questão":"Errou as questões"} {topic.positions.join(", ")}</small></div>
    </li>)}</ol></>}
    <section className={styles.nextStep} aria-labelledby="next-step-title">
      <p className={base.stepLabel}>Próximo passo</p><h2 id="next-step-title">Faça um simulado de verdade.</h2>
      <p>Novas questões do banco ETEC/IFSP, com correção ao terminar.</p>
      <Link className={`${base.continue} ${styles.actionLink}`} href={continueHref}>Fazer meu simulado<Image src="/icons/arrow-right.svg" width={23} height={23} alt=""/></Link>
      <p className={styles.accountHint}>{continueHref==="/cadastro"?"Crie sua conta grátis para continuar. Sem cartão.":"Escolha como quer continuar estudando."}</p>
    </section>
    {continueHref==="/cadastro"&&<p className={styles.signin}>Já tem conta? <Link href="/login">Entrar</Link></p>}
  </section>;
}
