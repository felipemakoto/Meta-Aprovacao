import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/user";
import { simulationRpc } from "@/lib/data/simulations";
import { parseCatalog } from "@/lib/quiz/simulation-contract";
import Simulations from "./simulations";
export const dynamic="force-dynamic";
export const metadata={title:"Simulados | ETEC / IF",robots:{index:false,follow:false}};
export default async function Page(){
 let user;try{user=await getVerifiedUser();}catch{return <Simulations unavailable/>;}
 if(!user?.email_confirmed_at)redirect("/login");
 let items;try{items=parseCatalog(await simulationRpc("simulation_catalog",{p_user_id:user.id}));}catch{return <Simulations unavailable/>;}return <Simulations items={items}/>;
}
