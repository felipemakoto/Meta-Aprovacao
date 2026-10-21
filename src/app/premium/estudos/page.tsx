import {redirect} from "next/navigation";
import Link from "next/link";
import StudyShell from "@/app/study-shell";
import {getVerifiedUser} from "@/lib/auth/user";
import {readStudyWorkspace} from "@/lib/data/premium-study";
import {studyAreas,type StudyArea} from "@/lib/premium-study/contract";
import Workspace from "./workspace";
import styles from "./study.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Estudos Premium | Meta Aprovação",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{area?:string;session?:string}>}){
 const user=await getVerifiedUser();if(!user?.email_confirmed_at)redirect("/login");
 const {area,session}=await searchParams;const selected=area&&Object.hasOwn(studyAreas,area)?area as StudyArea:"plan";
 let workspace;let locked=false;
 try{workspace=await readStudyWorkspace(user.id);}catch(e){locked=e instanceof Error&&e.message==="premium_required";}
 if(workspace)return <Workspace initial={workspace} area={selected} sessionId={typeof session==="string"&&workspace.sessions.some(s=>s.id===session)?session:undefined}/>;
 return <StudyShell active="premium"><main className={styles.page}><h1>{locked?"Amplie sua preparação":"Não foi possível carregar seus estudos"}</h1>
   <p>{locked?"Plano de estudos, revisões adaptativas, simulados personalizados e organização em um só lugar. Seus recursos gratuitos continuam disponíveis.":"Seus dados foram preservados. Tente novamente em instantes."}</p>
   {locked?<><ul className={styles.featureList}>{Object.values(studyAreas).map(name=><li key={name}>{name}</li>)}</ul><Link className={styles.primary} href="/premium">Conhecer o Premium</Link><Link className={styles.secondary} href="/dashboard">Continuar no Gratuito</Link></>:<Link className={styles.primary} href="/premium/estudos">Tentar novamente</Link>}
  </main></StudyShell>;
}
