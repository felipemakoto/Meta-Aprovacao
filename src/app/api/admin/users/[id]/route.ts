import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getClientIpFromHeaders, requireApiSession } from "@/lib/admin/auth/server";
import { checkCaktoConflict } from "@/lib/admin/domain/premium";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  addUserNote,
  deleteUserAnonymize,
  extendPremium,
  getUser,
  grantPremium,
  reactivateUser,
  resetUserPassword,
  revokePremium,
  suspendUser,
} from "@/lib/admin/data/users";
import type { SubscriptionRecord, SubscriptionStatus, SubscriptionOrigin } from "@/lib/admin/types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession();
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = await context.params;
    const user = await getUser(auth.session.papel, id);
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Buscar assinaturas do usuário via admin client
    let subscriptions: SubscriptionRecord[] = [];
    try {
      const adminClient = createAdminClient();
      const rpcResult = await adminClient.rpc("admin_list_subscriptions");
      const rows = rpcResult.data;

      if (Array.isArray(rows)) {
        const userRows = (rows as Array<Record<string, unknown>>).filter(
          (r) => r.user_id === id
        );
        subscriptions = userRows.map((r) => ({
          id: String(r.id),
          userId: String(r.user_id),
          userNome: user.nome,
          userEmail: user.email,
          planoNome: r.provider === "manual" ? "Acesso Manual" : "Meta Aprovação Premium",
          valorCentavos: r.provider === "cakto" ? 2299 : 0,
          status: (r.access_state === "revoked"
            ? "cancelada"
            : r.access_state === "granted"
              ? "ativa"
              : "expirada") as SubscriptionStatus,
          origem: (r.provider === "manual" ? "manual" : "cakto") as SubscriptionOrigin,
          externalId: String(r.external_subscription_id ?? r.id),
          gatewayUrl: null,
          inicioEm: String(r.access_from ?? r.created_at),
          expiraEm: r.access_until ? String(r.access_until) : null,
          vitalicio: false,
        }));
      }
    } catch {
      // sem assinaturas — tudo bem
    }

    const caktoCheck = checkCaktoConflict(subscriptions, id);

    return NextResponse.json({
      user,
      subscriptions,
      hasActiveCakto: caktoCheck.hasActiveCakto,
      caktoWarning: caktoCheck.warningMessage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Acesso negado.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiSession(request);
  if (auth.errorResponse) return auth.errorResponse;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { action?: string; payload?: unknown };
    const ip = getClientIpFromHeaders(request.headers);

    switch (body.action) {
      case "grant_premium": {
        const user = await grantPremium(auth.session, id, body.payload, ip);
        return NextResponse.json({ user, message: "Premium concedido com sucesso." });
      }
      case "extend_premium": {
        const user = await extendPremium(auth.session, id, body.payload, ip);
        return NextResponse.json({ user, message: "Premium estendido com sucesso." });
      }
      case "revoke_premium": {
        const user = await revokePremium(auth.session, id, body.payload, ip);
        return NextResponse.json({ user, message: "Premium revogado com sucesso." });
      }
      case "suspend": {
        const user = await suspendUser(auth.session, id, body.payload, ip);
        return NextResponse.json({ user, message: "Conta suspensa com sucesso." });
      }
      case "reactivate": {
        const user = await reactivateUser(auth.session, id, body.payload, ip);
        return NextResponse.json({ user, message: "Conta reativada com sucesso." });
      }
      case "reset_password": {
        const res = await resetUserPassword(auth.session, id, body.payload, ip);
        return NextResponse.json({
          ...res,
          message: res.message,
        });
      }
      case "delete_lgpd": {
        const user = await deleteUserAnonymize(auth.session, id, body.payload, ip);
        return NextResponse.json({
          user,
          message: "Conta anonimizada conforme a LGPD.",
        });
      }
      case "add_note": {
        const result = await addUserNote(auth.session, id, body.payload);
        return NextResponse.json({ ...result, message: "Nota interna registrada." });
      }
      default:
        return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
    }
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Dados inválidos." },
        { status: 400 }
      );
    }
    const message = err instanceof Error ? err.message : "Erro ao executar ação.";
    const status = message.startsWith("Acesso negado") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
