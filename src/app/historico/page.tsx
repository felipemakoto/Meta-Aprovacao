import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/user";
import { readHistory } from "@/lib/data/history";
import { parseHistory,type HistoryPage as HistoryPageData,type HistoryKind } from "@/lib/quiz/history-contract";
import History from "./history";
export const dynamic="force-dynamic";
export const metadata={title:"Seu histórico | Meta Aprovação",robots:{index:false,follow:false}};
export default async function HistoryPage({searchParams}:{searchParams:Promise<{kind?:string}>}){
 const requested=(await searchParams).kind;
 const initialKind:HistoryKind=requested==="practice"||requested==="simulations"?requested:"tests";
 let user;try{user=await getVerifiedUser();}catch{return <History unavailable/>;}
 if(!user?.email_confirmed_at)redirect("/login");
 let initial:HistoryPageData|null=null;
 try{const raw=await readHistory(user.id,initialKind,null);initial=parseHistory(raw,initialKind);}catch{}
 return <History initialKind={initialKind} initial={initial}/>;
}
