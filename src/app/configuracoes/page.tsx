import {redirect} from "next/navigation";
import {getVerifiedUser} from "@/lib/auth/user";
import {readSubscriptionAccess} from "@/lib/data/subscriptions";
import {parseSubscriptionAccess} from "@/lib/subscriptions/contract";
import StudyShell from "../study-shell";
import SettingsPanel from "./settings-panel";
export const dynamic="force-dynamic";
export const metadata={title:"Configurações | Meta Aprovação",robots:{index:false,follow:false}};
export default async function Page(){const user=await getVerifiedUser();if(!user?.email_confirmed_at)redirect('/login');let plan:'normal'|'premium'|'unknown'='unknown';let until:string|null=null;try{const access=parseSubscriptionAccess(await readSubscriptionAccess(user.id));plan=access.hasPremium?'premium':'normal';until=access.accessUntil;}catch{}return <StudyShell active="account" focus menu plain><main><SettingsPanel email={user.email??''} google={user.app_metadata.provider==='google'} plan={plan} until={until}/></main></StudyShell>;}
