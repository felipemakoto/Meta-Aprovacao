import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/admin/auth/server";

export default async function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  if (await getServerSession()) redirect("/admin");
  return children;
}
