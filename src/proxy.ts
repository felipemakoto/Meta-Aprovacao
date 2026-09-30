import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
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
  matcher: ["/api/auth/:path*", "/api/quiz/saved", "/api/practice", "/questoes", "/dashboard", "/cadastro/confirmado", "/login", "/nova-senha"],
};
