import { redirect } from "next/navigation";
import { UserDetailView } from "@/components/admin/UserDetailView";
import { getServerSession } from "@/lib/admin/auth/server";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession();
  if (!session) redirect("/admin/login");
  const { id } = await params;

  return <UserDetailView userId={id} actorRole={session.papel} />;
}
