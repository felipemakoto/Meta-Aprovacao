import styles from "./quiz.module.css";
import type {Ref} from "react";

export default function CorrectionLoading({title="Corrigindo suas respostas…",compact=false,headingRef}:{title?:string;compact?:boolean;headingRef?:Ref<HTMLHeadingElement>}) {
  return <section className={compact?styles.loadingCompact:styles.message} role="status" aria-live="polite" aria-busy="true">
    {compact?<p>{title}</p>:<><p className={styles.stepLabel}>Último passo</p><h1 ref={headingRef} tabIndex={-1}>{title}</h1><p>Seu resultado já vai aparecer.</p></>}
    <div className={styles.loadingBar} role="progressbar" aria-label={title} aria-valuetext="Em andamento"><span /></div>
  </section>;
}
