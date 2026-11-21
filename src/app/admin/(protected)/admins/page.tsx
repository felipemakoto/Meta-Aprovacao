import { redirect } from "next/navigation";
import { AdminsView } from "@/components/admin/AdminsView";
import { getServerSession } from "@/lib/admin/auth/server";
import { can } from "@/lib/admin/rbac";

export default async function AdminsPage() {
  const session = await getServerSession();
  if (!session) redirect("/admin/login");
  if (!can(session.papel, "admins:view")) redirect("/admin");

  return <AdminsView currentAdminId={session.adminId} />;
}
