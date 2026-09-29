import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadDashboard } from "@/lib/quiz/dashboard-contract";
import Dashboard from "./dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Seus estudos | ETEC / IF", robots: { index: false, follow: false } };
export default async function DashboardPage() {
  const state = await loadDashboard({
    user: async () => { const user = await getVerifiedUser(); return user?.email_confirmed_at ? user.id : null; },
    read: async user => {
      const { data, error } = await createAdminClient().rpc("read_quiz_dashboard", { p_user_id: user });
      if (error) throw new Error("dashboard_unavailable");
      return data;
    },
  });
  if (state.kind === "login") redirect("/login");
  return <Dashboard summary={state.kind === "ready" ? state.summary : null} />;
}
