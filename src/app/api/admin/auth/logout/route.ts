import { NextResponse } from "next/server";
import { getClientIpFromHeaders, getServerSession } from "@/lib/admin/auth/server";
import { adminWriteError } from "@/lib/admin/auth/request";
import { adminSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/admin/auth/session";
import { recordAuditLog } from "@/lib/admin/data/audit";
import { authHeaders } from "@/lib/auth/signup-http";

export async function POST(request: Request) {
  const originError = adminWriteError(request);
  if (originError) return originError;

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
    }).catch(() => {
      console.error("Falha ao registrar encerramento de sessão administrativa.");
    });
  }

  const response = NextResponse.json({ ok: true }, { headers: authHeaders });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    ...adminSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
