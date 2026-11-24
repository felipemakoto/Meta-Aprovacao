import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { handleAdminProxy } from "@/lib/admin/auth/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    return handleAdminProxy(request);
  }

  try {
    return await updateSession(request);
  } catch {
    return NextResponse.json(
      { error: "auth_unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store, max-age=0" } },
    );
  }
}

export const config = {
  // Ampliar quando novas rotas passarem a consumir a sessão do usuário.
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/configuracoes",
    "/api/account/:path*",
    "/api/auth/:path*",
    "/api/quiz/saved",
    "/api/practice",
    "/api/history",
    "/api/simulations",
    "/api/statistics",
    "/api/limits",
    "/premium/:path*",
    "/api/premium/:path*",
    "/estatisticas/:path*",
    "/simulados/:path*",
    "/historico/:path*",
    "/questoes",
    "/dashboard",
    "/cadastro/confirmado",
    "/login",
    "/nova-senha",
  ],
};
