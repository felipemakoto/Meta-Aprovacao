import Result from "./result";
import {getVerifiedUser} from "@/lib/auth/user";
export const metadata = { title: "Resultado do teste | Meta Aprovação", robots: { index: false, follow: false } };
export default async function ResultPage() {
  let signedIn=false;try{signedIn=!!(await getVerifiedUser())?.email_confirmed_at;}catch{}
  return <Result intro continueHref={signedIn?"/cadastro/confirmado":"/cadastro"} />;
}
