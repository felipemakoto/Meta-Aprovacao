import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/user";
import History from "./history";
export const dynamic="force-dynamic";
export const metadata={title:"Seu histórico | ETEC / IF",robots:{index:false,follow:false}};
export default async function HistoryPage({searchParams}:{searchParams:Promise<{kind?:string}>}){
 const requested=(await searchParams).kind;
 const initialKind=requested==="practice"||requested==="simulations"?requested:"tests";
 let user;try{user=await getVerifiedUser();}catch{return <History unavailable/>;}
 if(!user?.email_confirmed_at)redirect("/login");return <History initialKind={initialKind}/>;
}
