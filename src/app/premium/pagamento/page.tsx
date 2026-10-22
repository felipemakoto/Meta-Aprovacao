import {redirect} from "next/navigation";
import {getVerifiedUser} from "@/lib/auth/user";
import {readSubscriptionPricing} from "@/lib/data/subscriptions";
import {parseSubscriptionPricing} from "@/lib/subscriptions/contract";
import {directCheckoutEnabled} from "@/lib/subscriptions/direct-config";
import StudyShell from "@/app/study-shell";
import PaymentForm from "./payment-form";
export const dynamic="force-dynamic";
export const metadata={title:"Pagamento Premium | Meta Aprovação",robots:{index:false,follow:false}};
export default async function Page(){
 const user=await getVerifiedUser();if(!user?.email_confirmed_at||!user.email)redirect("/login");
 let access=null;try{access=parseSubscriptionPricing(await readSubscriptionPricing(user.id));}catch{/* Payment stays unavailable without verified access. */}
 if(access?.hasPremium)redirect("/premium/estudos");
 const verified=!!access;
 const enabled=verified&&directCheckoutEnabled();
 return <StudyShell focus plain><PaymentForm enabled={enabled} email={user.email} clientId={enabled?process.env.CAKTO_CLIENT_ID??"":""}/></StudyShell>;
}
