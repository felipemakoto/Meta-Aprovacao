import { notFound,redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getVerifiedUser } from "@/lib/auth/user";
import { readHistoryDetail } from "@/lib/data/history";
import { isHistoryId,parsePracticeReview } from "@/lib/quiz/history-contract";
import { toQuizResult } from "@/lib/quiz/result-contract";
import Result from "@/app/quiz/result/result";
import SimulationSession from "@/app/simulados/simulation-session";
import { parseSimulationResult } from "@/lib/quiz/simulation-contract";
import PracticeReview from "../../practice-review";
import base from "@/app/quiz/quiz.module.css";
import styles from "../../history.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Revisar atividade | ETEC / IF",robots:{index:false,follow:false}};
export default async function Detail({params}:{params:Promise<{kind:string;id:string}>}){
 const {kind,id}=await params;
 let user;try{user=await getVerifiedUser();}catch{return <Failure/>;}
 if(!user?.email_confirmed_at)redirect("/login");
 if((kind!=="tests"&&kind!=="practice"&&kind!=="simulations")||!isHistoryId(id))notFound();
 let value;try{value=await readHistoryDetail(user.id,kind,id);}catch{return <Failure/>;}
 if(!value)notFound();
 if(kind==="simulations"){let result;try{result=parseSimulationResult(value);}catch{return <Failure/>;}return <SimulationSession historyView initial={{result}}/>;}
 let result,review;try{if(kind==="tests")result=toQuizResult(value);else review=parsePracticeReview(value);}catch{return <Failure/>;}
 const view=result?<Result key={result.id} initialResult={result} saved/>:<div className={base.page}><PracticeReview review={review!}/></div>;
 return <><div className={styles.backRow}><Link className={styles.backLink} href={"/historico?kind="+kind}><Image className={styles.backIcon} src="/icons/arrow-right.svg" width={20} height={20} alt=""/>Voltar ao histórico</Link></div>{view}</>;
}
function Failure(){return <main className={base.page}><h1>Não foi possível carregar a atividade.</h1><p>Tente novamente em alguns instantes.</p><Link className={styles.backLink} href="/historico"><Image className={styles.backIcon} src="/icons/arrow-right.svg" width={20} height={20} alt=""/>Voltar ao histórico</Link></main>;}
