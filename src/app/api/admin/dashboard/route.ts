import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/admin/auth/server";
import { getDashboardMetrics } from "@/lib/admin/data/dashboard";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const rawRange = Number(searchParams.get("range") ?? "30");
    const range: 7 | 30 | 90 = rawRange === 7 ? 7 : rawRange === 90 ? 90 : 30;
    const metrics = await getDashboardMetrics(auth.session.papel, range);
    return NextResponse.json(metrics);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao carregar métricas.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
