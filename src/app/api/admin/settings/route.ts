import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getClientIpFromHeaders, requireApiSession } from "@/lib/admin/auth/server";
import { getSettings, updateSettings } from "@/lib/admin/data/settings";

export async function GET() {
  const auth = await requireApiSession();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const settings = await getSettings(auth.session.papel);
    return NextResponse.json(settings);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Acesso negado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireApiSession(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const body = await request.json();
    const updated = await updateSettings(
      auth.session,
      body,
      getClientIpFromHeaders(request.headers)
    );
    return NextResponse.json({
      settings: updated,
      message: "Configurações salvas com sucesso.",
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Configurações inválidas." },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao salvar configurações.";
    const status = message.startsWith("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
