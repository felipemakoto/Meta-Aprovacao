import { notFound,redirect } from "next/navigation";
import Link from "next/link";
import { getVerifiedUser } from "@/lib/auth/user";
import { simulationRpc } from "@/lib/data/simulations";
import { parseSimulationState } from "@/lib/quiz/simulation-contract";
import { isHistoryId } from "@/lib/quiz/history-contract";
import SimulationSession from "../simulation-session";
import base from "@/app/quiz/quiz.module.css";
export const dynamic="force-dynamic";
export const metadata={title:"Responder simulado | ETEC / IF",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{id:string}>}){
 const {id}=await params;let user;try{user=await getVerifiedUser();}catch{return <Failure/>;}
 if(!user?.email_confirmed_at)redirect("/login");if(!isHistoryId(id))notFound();
 let value;try{value=await simulationRpc("read_simulation",{p_user_id:user.id,p_id:id});}catch{return <Failure/>;}
 if(!value)notFound();let state;try{state=parseSimulationState(value);}catch{return <Failure/>;}return <SimulationSession initial={state}/>;
}
function Failure(){return <main className={base.page}><h1>Não foi possível carregar o simulado.</h1><p>Tente novamente em alguns instantes.</p><Link className={base.returnLink} href="/simulados">Voltar aos simulados</Link></main>;}
