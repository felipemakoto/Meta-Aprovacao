import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/admin/auth/server";
import { listSubscriptions } from "@/lib/admin/data/subscriptions";
import type { SubscriptionOrigin, SubscriptionStatus } from "@/lib/admin/types";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listSubscriptions(auth.session.papel, {
      search: searchParams.get("search") ?? undefined,
      status: (searchParams.get("status") as SubscriptionStatus | "all") ?? "all",
      origin: (searchParams.get("origin") as SubscriptionOrigin | "all") ?? "all",
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "20"),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Acesso negado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
