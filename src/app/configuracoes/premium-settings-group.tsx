"use client";
import {useId,type ReactNode} from "react";
import Link from "next/link";
import styles from "./settings.module.css";

export default function PremiumSettingsGroup({plan,label,children}:{plan:"normal"|"premium"|"unknown";label:string;children:ReactNode}){
 const id=useId(),locked=plan!=="premium";
 return <section className={`${styles.premiumGroup} ${locked?styles.premiumGroupLocked:""}`} aria-label={label}>
  <fieldset disabled={locked} className={styles.premiumFields} aria-label={label} aria-describedby={locked?id:undefined}>
   <div className={styles.premiumContent}>{children}</div>
  </fieldset>
  {locked&&<div className={styles.premiumNotice}>
   <span className={styles.lockIcon} aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>
   <h3 id={id}>{plan==="unknown"?"Acesso não confirmado":"Exclusivo Premium"}</h3>
   {plan==="unknown"?<span>Recarregue para consultar seu plano.</span>:<Link href="/premium" className={styles.premiumCta}>Conhecer Premium</Link>}
  </div>}
 </section>;
}
