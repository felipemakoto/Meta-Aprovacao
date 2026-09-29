import { notFound } from "next/navigation";
import Dashboard from "../dashboard";
export const dynamic = "force-dynamic";
export const metadata = { title: "Prévia do dashboard", robots: { index: false, follow: false } };
export default async function DashboardPreview({ searchParams }: { searchParams: Promise<{ state?: string; score?: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { state, score } = await searchParams;
  const correct = score === "10" ? 10 : score === "0" ? 0 : 7;
  return <Dashboard preview summary={state === "error" ? null : state === "empty" ? { answered: 0, correct: 0, latest: null } : {
    answered: 10, correct, latest: { id: "00000000-0000-4000-8000-000000000018", completedAt: "2026-09-29T12:00:00Z", total: 10, score: correct },
  }} />;
}
