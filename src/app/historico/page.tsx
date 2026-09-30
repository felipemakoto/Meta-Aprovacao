import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/user";
import History from "./history";
export const dynamic="force-dynamic";
export const metadata={title:"Seu histórico | ETEC / IF",robots:{index:false,follow:false}};
export default async function HistoryPage({searchParams}:{searchParams:Promise<{kind?:string}>}){
 const initialKind=(await searchParams).kind==="practice"?"practice":"tests";
 let user;try{user=await getVerifiedUser();}catch{return <History unavailable/>;}
 if(!user?.email_confirmed_at)redirect("/login");return <History initialKind={initialKind}/>;
}
