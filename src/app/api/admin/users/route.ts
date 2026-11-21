import { NextResponse } from "next/server";
import { requireApiSession } from "@/lib/admin/auth/server";
import { listUsers } from "@/lib/admin/data/users";
import type { UserPlan, UserStatus } from "@/lib/admin/types";

export async function GET(request: Request) {
  const auth = await requireApiSession();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const result = await listUsers(auth.session.papel, {
      search: searchParams.get("search") ?? undefined,
      plan: (searchParams.get("plan") as UserPlan | "all") ?? "all",
      status: (searchParams.get("status") as UserStatus | "all") ?? "all",
      createdFrom: searchParams.get("createdFrom") ?? undefined,
      createdTo: searchParams.get("createdTo") ?? undefined,
      activeFrom: searchParams.get("activeFrom") ?? undefined,
      activeTo: searchParams.get("activeTo") ?? undefined,
      sortBy:
        (searchParams.get("sortBy") as
          | "nome"
          | "criadoEm"
          | "ultimaAtividadeEm"
          | "plano") ?? "criadoEm",
      sortDir: (searchParams.get("sortDir") as "asc" | "desc") ?? "desc",
      page: Number(searchParams.get("page") ?? "1"),
      pageSize: Number(searchParams.get("pageSize") ?? "20"),
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao listar usuários.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
