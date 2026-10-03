import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/user";
import { readSubscriptionAccess } from "@/lib/data/subscriptions";
import { loadPremium, premiumOffer } from "@/lib/subscriptions/contract";
import Premium from "./premium";
export const dynamic = "force-dynamic";
export const metadata = { title: "Premium | ETEC / IF", robots: { index: false, follow: false } };
export default async function Page() {
  const state = await loadPremium({
    user: async () => { const user = await getVerifiedUser(); return user?.email_confirmed_at ? user.id : null; },
    read: readSubscriptionAccess,
  });
  if (state.kind === "login") redirect("/login");
  return <Premium state={state} offer={premiumOffer(new Date())} />;
}
