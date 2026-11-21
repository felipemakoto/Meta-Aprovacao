import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getServerSession } from "@/lib/admin/auth/server";

export default async function ProtectedPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}
