import { NextResponse } from "next/server";
import { getClientIpFromHeaders, requireApiSession } from "@/lib/admin/auth/server";
import { recordAuditLog } from "@/lib/admin/data/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "O nome deve ter pelo menos 2 caracteres.").max(100),
});

export async function PUT(request: Request) {
  const auth = await requireApiSession(request);
  if (auth.errorResponse) return auth.errorResponse;
  const { session } = auth;

  try {
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Nome inválido." },
        { status: 400 }
      );
    }

    const nextName = parsed.data.name;
    const adminClient = createAdminClient();

    // 1. Atualizar na tabela admin_users
    const { error: dbError } = await adminClient
      .from("admin_users")
      .update({ name: nextName, updated_at: new Date().toISOString() })
      .eq("id", session.adminId);

    if (dbError) {
      return NextResponse.json(
        { error: "Erro ao atualizar nome no banco de dados." },
        { status: 500 }
      );
    }

    // 2. Atualizar user_metadata no auth.users
    await adminClient.auth.admin.updateUserById(session.adminId, {
      user_metadata: { name: nextName, full_name: nextName },
    }).catch(() => null);

    // 3. Registrar auditoria
    const ip = getClientIpFromHeaders(request.headers);
    await recordAuditLog({
      adminId: session.adminId,
      adminNome: nextName,
      adminEmail: session.email,
      acao: "admin_update_profile",
      descricao: `Administrador alterou seu próprio nome de "${session.nome}" para "${nextName}"`,
      ipSimulado: ip,
      usuarioAfetadoId: session.adminId,
      usuarioAfetadoNome: nextName,
    });

    return NextResponse.json({
      ok: true,
      name: nextName,
      message: "Nome atualizado com sucesso!",
    });

  } catch {
    return NextResponse.json(
      { error: "Erro inesperado ao atualizar nome." },
      { status: 500 }
    );
  }
}
