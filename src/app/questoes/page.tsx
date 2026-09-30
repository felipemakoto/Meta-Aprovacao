import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/user";
import Practice from "./practice";
export const dynamic="force-dynamic";
export const metadata={title:"Questões | ETEC / IF",robots:{index:false,follow:false}};
export default async function QuestionsPage(){
  let user;try{user=await getVerifiedUser();}catch{return <Practice unavailable />;}
  if(!user?.email_confirmed_at)redirect("/login");
  return <Practice />;
}
