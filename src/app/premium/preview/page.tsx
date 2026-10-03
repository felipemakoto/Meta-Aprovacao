import { notFound } from "next/navigation";
import { premiumOffer, type PremiumState } from "@/lib/subscriptions/contract";
import Premium from "../premium";
export const dynamic = "force-dynamic";
export const metadata = { title: "Prévia Premium", robots: { index: false, follow: false } };
export default async function Preview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const state: PremiumState = query.state === "error" ? { kind: "error" } : {
    kind: "ready", access: query.state === "active" ? { hasPremium: true, accessUntil: "2026-11-02T15:00:00Z" } : { hasPremium: false, accessUntil: null },
  };
  const offer = premiumOffer(new Date(query.offer === "regular" ? "2026-11-01T12:00:00Z" : "2026-10-02T12:00:00Z"));
  return <Premium state={state} offer={offer} preview />;
}
