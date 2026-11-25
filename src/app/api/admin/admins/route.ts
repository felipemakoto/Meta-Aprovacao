import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getClientIpFromHeaders, requireApiSession } from "@/lib/admin/auth/server";
import {
  createAdmin,
  listAdmins,
  toggleAdminStatus,
  updateAdminRole,
} from "@/lib/admin/data/admins";

export async function GET() {
  const auth = await requireApiSession();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const admins = await listAdmins(auth.session.papel);
    return NextResponse.json({ items: admins });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Acesso negado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(request: Request) {
  const auth = await requireApiSession(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const admin = await createAdmin(
      auth.session,
      body,
      getClientIpFromHeaders(request.headers)
    );
    return NextResponse.json({
      admin,
      message: `Administrador "${admin.nome}" criado com sucesso.`,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao criar administrador.";
    const status = message.startsWith("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = (await request.json()) as {
      id: string;
      action: "update_role" | "toggle_status";
      papel?: string;
    };
    const ip = getClientIpFromHeaders(request.headers);

    if (body.action === "toggle_status") {
      const admin = await toggleAdminStatus(auth.session, body.id, ip);
      return NextResponse.json({
        admin,
        message: `Administrador ${admin.ativo ? "reativado" : "desativado"} com sucesso.`,
      });
    }

    const admin = await updateAdminRole(auth.session, body.id, { papel: body.papel }, ip);
    return NextResponse.json({
      admin,
      message: "Papel do administrador atualizado.",
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao atualizar administrador.";
    const status = message.startsWith("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
