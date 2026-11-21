import { NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/admin/auth/credentials";
import {
  checkLoginLockout,
  clearLoginAttempts,
  registerFailedLoginAttempt,
} from "@/lib/admin/auth/lockout";
import { getClientIpFromHeaders } from "@/lib/admin/auth/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSessionToken,
} from "@/lib/admin/auth/session";
import { recordAuditLog } from "@/lib/admin/data/audit";
import { loginSchema } from "@/lib/admin/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const ip = getClientIpFromHeaders(request.headers);
    const lockKey = `${email.toLowerCase()}::${ip}`;

    const lockStatus = checkLoginLockout(lockKey);
    if (lockStatus.locked) {
      const mins = Math.ceil(lockStatus.remainingSeconds / 60);
      return NextResponse.json(
        {
          error: `Muitas tentativas inválidas. Acesso bloqueado temporariamente por ${mins} min (${lockStatus.remainingSeconds}s).`,
        },
        { status: 429 }
      );
    }

    const result = await verifyAdminCredentials(email, password);
    if (!result.ok) {
      const attempt = registerFailedLoginAttempt(lockKey);
      await recordAuditLog({
        adminId: null,
        adminNome: "Tentativa não autenticada",
        adminEmail: email,
        acao: "login_failed",
        descricao: `Falha de login: ${result.reason}`,
        ipSimulado: ip,
        usuarioAfetadoId: null,
        usuarioAfetadoNome: null,
      });

      if (attempt.locked) {
        return NextResponse.json(
          {
            error:
              "Conta temporariamente bloqueada após 5 tentativas incorretas. Tente novamente em 15 minutos.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: `${result.reason} (${attempt.attemptsLeft} tentativa(s) restante(s) antes do bloqueio).`,
        },
        { status: 401 }
      );
    }

    clearLoginAttempts(lockKey);

    const token = await signSessionToken({
      adminId: result.admin.id,
      nome: result.admin.nome,
      email: result.admin.email,
      papel: result.admin.papel,
    });

    await recordAuditLog({
      adminId: result.admin.id,
      adminNome: result.admin.nome,
      adminEmail: result.admin.email,
      acao: "login_success",
      descricao: `Login realizado como ${result.admin.papel}.`,
      ipSimulado: ip,
      usuarioAfetadoId: null,
      usuarioAfetadoNome: null,
    });

    const response = NextResponse.json({
      admin: {
        id: result.admin.id,
        nome: result.admin.nome,
        email: result.admin.email,
        papel: result.admin.papel,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao processar login." },
      { status: 500 }
    );
  }
}
