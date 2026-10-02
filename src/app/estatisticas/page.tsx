import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/user";
import { statistics } from "@/lib/data/statistics";
import Statistics from "./statistics";
export const dynamic="force-dynamic";
export const metadata={title:"Estatísticas | ETEC / IF",robots:{index:false,follow:false}};
export default async function Page(){let user;try{user=await getVerifiedUser();}catch{return <Statistics/>;}if(!user?.email_confirmed_at)redirect("/login");let initial;try{initial=await statistics(user.id,"all");}catch{return <Statistics/>;}return <Statistics initial={initial}/>;}
