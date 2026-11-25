import { NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/admin/auth/credentials";
import { adminWriteError } from "@/lib/admin/auth/request";
import { getClientIpFromHeaders } from "@/lib/admin/auth/server";
import {
  adminSessionCookieOptions,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  signSessionToken,
} from "@/lib/admin/auth/session";
import { recordAuditLog } from "@/lib/admin/data/audit";
import { loginSchema } from "@/lib/admin/schemas";
import { loginRateKeys } from "@/lib/auth/login-rate-limit";
import { AuthBodyError, readAuthJson } from "@/lib/auth/request-body";
import { authHeaders } from "@/lib/auth/signup-http";
import { createAdminClient } from "@/lib/supabase/admin";

const invalidCredentials = "E-mail ou senha inválidos.";

export async function POST(request: Request) {
  const originError = adminWriteError(request);
  if (originError) return originError;

  const json = (error: string, status: number) => NextResponse.json({ error }, {
    status,
    headers: authHeaders,
  });
  if (new URL(request.url).search) return json("Dados inválidos.", 400);
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return json("Envie os dados no formato JSON.", 415);
  }

  try {
    const parsed = loginSchema.safeParse(await readAuthJson(request, 4096));
    if (!parsed.success) return json("Dados inválidos.", 400);

    const { email, password } = parsed.data;
    const secret = process.env.SESSION_SECRET ?? "";
    if (secret.length < 32) throw new Error("Configuração indisponível para login administrativo.");
    const keys = loginRateKeys(request, email, "admin:" + secret, process.env.VERCEL === "1");
    const { data: allowed, error } = await createAdminClient()
      .rpc("reserve_login_attempt", { p_network: keys.network, p_account: keys.account, p_pair: keys.pair })
      .abortSignal(AbortSignal.timeout(5000));
    if (error || typeof allowed !== "boolean") throw new Error("Limite de acesso indisponível.");
    if (!allowed) {
      const response = json("Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429);
      response.headers.set("Retry-After", "300");
      return response;
    }

    const result = await verifyAdminCredentials(email, password);
    const admin = result.ok ? result.admin : null;
    await recordAuditLog({
      adminId: admin?.id ?? null,
      adminNome: admin?.nome ?? "Tentativa não autenticada",
      adminEmail: admin?.email ?? email,
      acao: admin ? "login_success" : "login_failed",
      descricao: admin ? "Login administrativo realizado." : "Tentativa de login recusada.",
      ipSimulado: getClientIpFromHeaders(request.headers),
      usuarioAfetadoId: null,
      usuarioAfetadoNome: null,
    });
    if (!admin) return json(invalidCredentials, 401);

    const token = await signSessionToken({
      adminId: admin.id,
      nome: admin.nome,
      email: admin.email,
      papel: admin.papel,
    });
    const response = NextResponse.json({ ok: true }, { headers: authHeaders });
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      ...adminSessionCookieOptions(),
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    if (error instanceof AuthBodyError) return json("Não foi possível ler os dados enviados.", error.status);
    return json("Não foi possível entrar agora. Tente novamente.", 503);
  }
}
