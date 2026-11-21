import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/admin/auth/server";
import { listAuditLogs } from "@/lib/admin/data/audit";
import type { AuditActionType } from "@/lib/admin/types";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listAuditLogs(auth.session.papel, {
      adminQuery: searchParams.get("adminQuery") ?? undefined,
      action: (searchParams.get("action") as AuditActionType | "all") ?? "all",
      userQuery: searchParams.get("userQuery") ?? undefined,
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
