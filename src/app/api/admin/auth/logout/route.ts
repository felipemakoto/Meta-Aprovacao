import { NextResponse } from "next/server";
import { getClientIpFromHeaders, getServerSession } from "@/lib/admin/auth/server";
import { SESSION_COOKIE_NAME } from "@/lib/admin/auth/session";
import { recordAuditLog } from "@/lib/admin/data/audit";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (session) {
    await recordAuditLog({
      adminId: session.adminId,
      adminNome: session.nome,
      adminEmail: session.email,
      acao: "logout",
      descricao: "Sessão encerrada pelo administrador.",
      ipSimulado: getClientIpFromHeaders(request.headers),
      usuarioAfetadoId: null,
      usuarioAfetadoNome: null,
    });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
