import { notFound } from "next/navigation";
import RecoveryForm from "../../recuperar-senha/recovery-form";
export const dynamic = "force-dynamic";
export default function Preview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <RecoveryForm update preview />;
}
