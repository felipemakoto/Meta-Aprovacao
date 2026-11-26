import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { handleAdminProxy } from "@/lib/admin/auth/proxy";
import { maintenanceResponse } from "@/lib/site-status/maintenance";
import { readPublicSiteStatus } from "@/lib/site-status/server";

const sessionRoutes = new Set([
  "/configuracoes", "/api/quiz/saved", "/api/practice", "/api/history",
  "/api/simulations", "/api/statistics", "/api/limits", "/questoes",
  "/dashboard", "/cadastro/confirmado", "/login", "/nova-senha",
]);
const sessionSections = ["/api/account", "/api/auth", "/premium", "/api/premium", "/estatisticas", "/simulados", "/historico"];

function inSection(path: string, section: string) {
  return path === section || path.startsWith(section + "/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (inSection(pathname, "/admin") || inSection(pathname, "/api/admin")) {
    return handleAdminProxy(request);
  }

  if (pathname === "/api/site-status" || pathname === "/api/webhooks/cakto") {
    return NextResponse.next();
  }
  const status = await readPublicSiteStatus();
  if (status.maintenance) return maintenanceResponse(request, pathname, status.maintenance_message);

  if (!sessionRoutes.has(pathname) && !sessionSections.some(section => inSection(pathname, section))) {
    return NextResponse.next();
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
  matcher: ["/((?!_next/|(?:fonts|icons|images|pwa)/|manifest.webmanifest$|[^/]+\\.[^/]+$).*)"],
};
