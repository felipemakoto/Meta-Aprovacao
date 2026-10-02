import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadDashboard } from "@/lib/quiz/dashboard-contract";
import Dashboard from "./dashboard";
import { statistics } from "@/lib/data/statistics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seus estudos | ETEC / IF", robots: { index: false, follow: false } };
export default async function DashboardPage() {
  const identity=getVerifiedUser().then(user=>user?.email_confirmed_at?user.id:null);
  const state = await loadDashboard({
    user: () => identity,
    read: async user => {
      const { data, error } = await createAdminClient().rpc("read_quiz_dashboard", { p_user_id: user });
      if (error) throw new Error("dashboard_unavailable");
      return data;
    },
  });
  if (state.kind === "login") redirect("/login");
  let activity=null;
  const verifiedId=await identity.catch(()=>null);
  if(verifiedId)try{const value=await statistics(verifiedId,"all");activity={answered:value.answered,correct:value.correct,simulations:value.simulations};}catch{}
  return <Dashboard summary={state.kind === "ready" ? state.summary : null} activity={activity}/>;
}
