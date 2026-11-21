import { NextResponse, type NextRequest } from "next/server.js";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./src/lib/admin/auth/session.ts";
import { can } from "./src/lib/admin/rbac.ts";

/**
 * Middleware de proteção das rotas administrativas /admin/* e /api/admin/*
 * 
 * Esconder botões na interface não conta como proteção:
 * O middleware intercepta toda requisição de página e API administrativa no servidor.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/auth/login";
  const isLogoutApi = pathname === "/api/admin/auth/logout";

  if (isLoginApi || isLogoutApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);

  if (isLoginPage) {
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Não autenticado. Faça login novamente." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Verificação de papel (RBAC) por rota no servidor
  if (pathname.startsWith("/admin/admins") && !can(session.papel, "admins:view")) {
    return NextResponse.redirect(new URL("/admin?erro=sem-permissao", request.url));
  }
  if (pathname.startsWith("/admin/usuarios") && !can(session.papel, "users:view")) {
    return NextResponse.redirect(new URL("/admin?erro=sem-permissao", request.url));
  }
  if (pathname.startsWith("/admin/configuracoes") && !can(session.papel, "settings:view")) {
    return NextResponse.redirect(new URL("/admin?erro=sem-permissao", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
