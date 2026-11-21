import { redirect } from "next/navigation";
import { AuditView } from "@/components/admin/AuditView";
import { getServerSession } from "@/lib/admin/auth/server";

export default async function AuditPage() {
  const session = await getServerSession();
  if (!session) redirect("/admin/login");

  return <AuditView actorRole={session.papel} />;
}
