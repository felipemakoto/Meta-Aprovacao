import { z } from "zod";
import { requireApiSession } from "@/lib/admin/auth/server";
import { can } from "@/lib/admin/rbac";
import { AuthBodyError, readAuthJson } from "@/lib/auth/request-body";
import { readSiteStatus, updateSiteStatus } from "@/lib/site-status/server";

const changeSchema = z.union([
  z.strictObject({ announcement: z.string().trim().min(1).max(300).nullable() }),
  z.strictObject({ maintenance: z.boolean() }),
  z.strictObject({ maintenance_message: z.string().trim().min(1).max(300).nullable() }),
]);

export async function GET() {
  const auth = await requireApiSession();
  if (auth.errorResponse) return auth.errorResponse;
  if (!can(auth.session.papel, "settings:view")) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }
  try {
    const status = await readSiteStatus();
    return Response.json({ ...status, canManage: can(auth.session.papel, "settings:manage_maintenance") });
  } catch {
    return Response.json({ error: "Não foi possível consultar o status do site." }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireApiSession(request);
  if (auth.errorResponse) return auth.errorResponse;
  if (!can(auth.session.papel, "settings:manage_maintenance")) {
    return Response.json({ error: "Acesso negado." }, { status: 403 });
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return Response.json({ error: "Envie os dados no formato JSON." }, { status: 415 });
  }
  try {
    const parsed = changeSchema.safeParse(await readAuthJson(request, 4096));
    if (!parsed.success) return Response.json({ error: "Dados inválidos." }, { status: 400 });
    return Response.json(await updateSiteStatus(parsed.data));
  } catch (error) {
    if (error instanceof AuthBodyError) {
      return Response.json({ error: "Não foi possível ler os dados enviados." }, { status: error.status });
    }
    return Response.json({ error: "Não foi possível atualizar o status do site." }, { status: 503 });
  }
}
