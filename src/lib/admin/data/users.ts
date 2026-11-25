import {
  calculatePremiumExpiration,
  checkCaktoConflict,
  type PremiumDurationOption,
} from "../domain/premium";
import { assertCan } from "../rbac";
import {
  addNoteSchema,
  deleteUserLgpdSchema,
  extendPremiumSchema,
  grantPremiumSchema,
  sensitiveReasonSchema,
} from "../schemas";
import type {
  AdminRole,
  PlatformUser,
  SessionPayload,
  SubjectArea,
  UserPlan,
  UserStatus,
} from "../types";
import { recordAuditLog, type PaginatedResult } from "./audit";
import { verifyAdminCredentials } from "../auth/credentials";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStore } from "./store";

export interface ListUsersParams {
  search?: string;
  plan?: UserPlan | "all";
  status?: UserStatus | "all";
  createdFrom?: string;
  createdTo?: string;
  activeFrom?: string;
  activeTo?: string;
  sortBy?: "nome" | "criadoEm" | "ultimaAtividadeEm" | "plano";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function listUsers(
  actorRole: AdminRole,
  params: ListUsersParams = {}
): Promise<PaginatedResult<PlatformUser>> {
  assertCan(actorRole, "users:view");

  try {
    const adminClient = createAdminClient();
    const { data: authList, error: authError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (!authError && authList?.users) {
      const page = params.page ?? 1;
      const pageSize = params.pageSize ?? 15;

      const realUsers: PlatformUser[] = await Promise.all(
        authList.users.map(async (u) => {
          const name =
            (u.user_metadata?.name as string) ||
            (u.user_metadata?.full_name as string) ||
            u.email?.split("@")[0] ||
            "Estudante";

          let plano: UserPlan = "gratis";
          let premiumExpiraEm: string | null = null;
          let origemPremium: PlatformUser["origemPremium"] = null;
          const status: UserStatus = u.user_metadata?.is_suspended ? "suspenso" : "ativo";

          try {
            const { data: subAccess } = await adminClient.rpc("read_subscription_access", {
              p_user_id: u.id,
            });
            if (subAccess?.hasPremium) {
              plano = "premium";
              premiumExpiraEm = subAccess.accessUntil ?? null;
              origemPremium = "cakto";
            }
          } catch {}

          // Fallback persistente caso a migration de assinaturas manuais não tenha sido rodada ainda no banco
          if (u.user_metadata?.manual_premium) {
            const exp = u.user_metadata.premium_access_until;
            if (!exp || new Date(exp) > new Date()) {
              plano = "premium";
              premiumExpiraEm = exp ?? null;
              origemPremium = "manual";
            }
          }

          return {
            id: u.id,
            nome: name,
            email: u.email ?? "",
            cpfMascarado: "***.***.***-**",
            telefone: "",
            plano,
            status,
            origemPremium,
            premiumInicioEm: (u.user_metadata?.premium_granted_at as string) ?? null,
            premiumExpiraEm,
            premiumVitalicio: !premiumExpiraEm && plano === "premium",
            criadoEm: u.created_at,
            ultimaAtividadeEm: u.last_sign_in_at ?? u.created_at,
            simulados: [],
            desempenhoPorAssunto: [],
            questoesErradas: [],
            historicoLogins: [],
            notasInternas: [],
          };
        })
      );

      let filtered = [...realUsers];

      if (params.search?.trim()) {
        const q = params.search.trim().toLowerCase();
        filtered = filtered.filter(
          (u) =>
            u.nome.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q)
        );
      }

      if (params.plan && params.plan !== "all") {
        filtered = filtered.filter((u) => u.plano === params.plan);
      }

      if (params.status && params.status !== "all") {
        filtered = filtered.filter((u) => u.status === params.status);
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize) || 1;
      const start = (page - 1) * pageSize;
      const items = filtered.slice(start, start + pageSize);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages,
      };
    }
  } catch {}

  throw new Error("Não foi possível consultar os usuários. Tente novamente.");
}

export async function getUser(
  actorRole: AdminRole,
  userId: string
): Promise<PlatformUser | null> {
  assertCan(actorRole, "users:view");

  try {
    const adminClient = createAdminClient();
    const { data: u, error } = await adminClient.auth.admin.getUserById(userId);
    if (!error && u?.user) {
      const user = u.user;
      const name =
        (user.user_metadata?.name as string) ||
        (user.user_metadata?.full_name as string) ||
        user.email?.split("@")[0] ||
        "Estudante";

      let plano: UserPlan = "gratis";
      let premiumExpiraEm: string | null = null;
      let origemPremium: PlatformUser["origemPremium"] = null;
      const status: UserStatus = user.user_metadata?.is_suspended ? "suspenso" : "ativo";

      const [subAccess, stats, hist, notesRes] = await Promise.all([
        (async () => { try { return await adminClient.rpc("read_subscription_access", { p_user_id: user.id }); } catch { return { data: null }; } })(),
        (async () => { try { return await adminClient.rpc("read_study_statistics", { p_user_id: user.id, p_period: "all" }); } catch { return { data: null }; } })(),
        (async () => { try { return await adminClient.rpc("read_study_history", { p_user_id: user.id, p_kind: "simulations" }); } catch { return { data: null }; } })(),
        (async () => { try { return await adminClient.from("admin_notes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }); } catch { return { data: null }; } })(),
      ]);

      if (subAccess.data?.hasPremium) {
        plano = "premium";
        premiumExpiraEm = subAccess.data.accessUntil ?? null;
        origemPremium = "cakto";
      }

      // Suporte a concessão manual
      if (user.user_metadata?.manual_premium) {
        const exp = user.user_metadata.premium_access_until;
        if (!exp || new Date(exp) > new Date()) {
          plano = "premium";
          premiumExpiraEm = exp ?? null;
          origemPremium = "manual";
        }
      }

      const simulados = (hist.data?.items ?? []).map((sim: { id: string; title: string; at: string; durationSeconds?: number; total: number; score: number }) => ({
        id: sim.id,
        titulo: sim.title,
        data: sim.at,
        tempoGastoMinutos: Math.round((sim.durationSeconds ?? 0) / 60),
        totalQuestoes: sim.total,
        acertos: sim.score,
        nota: Math.round((sim.score / sim.total) * 10),
      }));

      const subjectNames: Record<string, { area: string; name: string }> = {
        matematica: { area: "Matemática", name: "Álgebra e Geometria" },
        portugues: { area: "Português", name: "Gramática e Interpretação" },
        ciencias: { area: "Ciências da Natureza", name: "Física, Química e Biologia" },
        historia: { area: "Ciências Humanas", name: "História Geral e do Brasil" },
        geografia: { area: "Ciências Humanas", name: "Geografia e Meio Ambiente" },
      };

      const desempenhoPorAssunto = (stats.data?.subjects ?? []).map((s: { subject: string; answered: number; correct: number }) => {
        const meta = subjectNames[s.subject] ?? { area: "Outros", name: s.subject };
        return {
          materia: meta.area as SubjectArea,
          assunto: meta.name,
          totalRespondidas: s.answered,
          acertos: s.correct,
          erros: s.answered - s.correct,
        };
      });

      const notasInternas = (notesRes.data ?? []).map((n: { id: string; author_id: string; author_name: string; content: string; created_at: string }) => ({
        id: n.id,
        adminId: n.author_id,
        adminNome: n.author_name,
        conteudo: n.content,
        criadoEm: n.created_at,
      }));

      return {
        id: user.id,
        nome: name,
        email: user.email ?? "",
        cpfMascarado: "***.***.***-**",
        telefone: "",
        plano,
        status,
        origemPremium,
        premiumInicioEm: (user.user_metadata?.premium_granted_at as string) ?? null,
        premiumExpiraEm,
        premiumVitalicio: !premiumExpiraEm && plano === "premium",
        criadoEm: user.created_at,
        ultimaAtividadeEm: user.last_sign_in_at ?? user.created_at,
        simulados,
        desempenhoPorAssunto,
        questoesErradas: [],
        historicoLogins: [],
        notasInternas,
      };
    }
  } catch {}

  const store = getStore();
  const found = store.users.find((u) => u.id === userId);
  return found ? JSON.parse(JSON.stringify(found)) : null;
}

export async function grantPremium(
  session: SessionPayload,
  userId: string,
  rawPayload: unknown,
  ipSimulado: string
): Promise<{ ok: true; user: PlatformUser }> {
  assertCan(session.papel, "users:grant_premium");
  const parsed = grantPremiumSchema.parse(rawPayload);

  const target = await getUser(session.papel, userId);
  if (!target) throw new Error("Usuário não encontrado.");

  const caktoCheck = checkCaktoConflict(getStore().subscriptions, userId);
  if (caktoCheck.hasActiveCakto && !parsed.confirmCaktoConflict) {
    throw new Error(
      caktoCheck.warningMessage ??
        "Assinatura Cakto ativa detectada. Confirme explicitamente para prosseguir."
    );
  }

  let durationOption: PremiumDurationOption;
  if (parsed.durationType === "lifetime") {
    durationOption = { mode: "lifetime" };
  } else if (parsed.durationType === "custom") {
    durationOption = { mode: "custom", customDateIso: parsed.customDate! };
  } else {
    durationOption = {
      mode: "days",
      days: Number(parsed.durationType) as 7 | 30 | 90 | 365,
    };
  }

  const { expiraEm, vitalicio } = calculatePremiumExpiration(durationOption);

  target.plano = "premium";
  target.origemPremium = "manual";
  target.premiumInicioEm = new Date().toISOString();
  target.premiumExpiraEm = expiraEm;
  target.premiumVitalicio = vitalicio;

  // Persistir no Supabase real
  const adminClient = createAdminClient();
  let rpcOk = false;
  try {
    const { error: rpcErr } = await adminClient.rpc("admin_grant_manual_premium", {
      p_user_id: userId,
      p_access_until: expiraEm,
    });
    if (!rpcErr) {
      rpcOk = true;
    } else {
      console.warn("[grantPremium] RPC indisponível, usando fallback user_metadata:", rpcErr.message);
    }
  } catch (rpcEx) {
    console.warn("[grantPremium] RPC lançou exceção:", rpcEx);
  }

  // Fallback: salva no user_metadata (funciona com auth.admin.updateUserById)
  if (!rpcOk) {
    const { error: metaErr } = await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        manual_premium: true,
        premium_access_until: expiraEm ?? null,
        premium_granted_at: new Date().toISOString(),
      },
    });
    if (metaErr) {
      console.error("[grantPremium] Fallback updateUserById falhou:", metaErr.message);
      throw new Error("Não foi possível conceder Premium. Tente novamente.");
    }
  }

  await recordAuditLog({
    adminId: session.adminId,
    adminNome: session.nome,
    adminEmail: session.email,
    acao: "grant_premium",
    descricao: `Concedeu Premium manual (${parsed.durationType}${vitalicio ? " - vitalício" : ""}).`,
    motivo: parsed.reason,
    ipSimulado,
    usuarioAfetadoId: target.id,
    usuarioAfetadoNome: target.nome,
  });

  return { ok: true, user: target };
}

export async function extendPremium(
  session: SessionPayload,
  userId: string,
  rawPayload: unknown,
  ipSimulado: string
): Promise<{ ok: true; user: PlatformUser }> {
  assertCan(session.papel, "users:grant_premium");
  const parsed = extendPremiumSchema.parse(rawPayload);

  const target = await getUser(session.papel, userId);
  if (!target) throw new Error("Usuário não encontrado.");

  const daysNum = Number(parsed.days) as 7 | 30 | 90 | 365;
  const { expiraEm } = calculatePremiumExpiration(
    { mode: "days", days: daysNum },
    new Date(),
    target.premiumExpiraEm
  );

  target.plano = "premium";
  target.premiumExpiraEm = expiraEm;

  const adminClient2 = createAdminClient();
  let rpcOk2 = false;
  try {
    const { error: rpcErr } = await adminClient2.rpc("admin_grant_manual_premium", {
      p_user_id: userId,
      p_access_until: expiraEm,
    });
    if (!rpcErr) rpcOk2 = true;
    else console.warn("[extendPremium] RPC indisponível:", rpcErr.message);
  } catch (ex) {
    console.warn("[extendPremium] RPC lançou:", ex);
  }
  if (!rpcOk2) {
    const { error: metaErr } = await adminClient2.auth.admin.updateUserById(userId, {
      user_metadata: {
        manual_premium: true,
        premium_access_until: expiraEm ?? null,
        premium_extended_at: new Date().toISOString(),
      },
    });
    if (metaErr) {
      console.error("[extendPremium] Fallback falhou:", metaErr.message);
      throw new Error("Não foi possível estender Premium. Tente novamente.");
    }
  }

  await recordAuditLog({
    adminId: session.adminId,
    adminNome: session.nome,
    adminEmail: session.email,
    acao: "extend_premium",
    descricao: `Estendeu Premium em +${parsed.days} dias.`,
    motivo: parsed.reason,
    ipSimulado,
    usuarioAfetadoId: target.id,
    usuarioAfetadoNome: target.nome,
  });

  return { ok: true, user: target };
}

export async function revokePremium(
  session: SessionPayload,
  userId: string,
  rawPayload: unknown,
  ipSimulado: string
): Promise<{ ok: true; user: PlatformUser }> {
  assertCan(session.papel, "users:revoke_premium");
  const parsed = sensitiveReasonSchema.parse(rawPayload);

  const target = await getUser(session.papel, userId);
  if (!target) throw new Error("Usuário não encontrado.");

  target.plano = "gratis";
  target.origemPremium = null;
  target.premiumExpiraEm = null;
  target.premiumVitalicio = false;

  const adminClient3 = createAdminClient();
  let rpcOk3 = false;
  try {
    const { error: rpcErr } = await adminClient3.rpc("admin_revoke_manual_premium", {
      p_user_id: userId,
    });
    if (!rpcErr) rpcOk3 = true;
    else console.warn("[revokePremium] RPC indisponível:", rpcErr.message);
  } catch (ex) {
    console.warn("[revokePremium] RPC lançou:", ex);
  }
  if (!rpcOk3) {
    const { error: metaErr } = await adminClient3.auth.admin.updateUserById(userId, {
      user_metadata: {
        manual_premium: false,
        premium_access_until: null,
        premium_revoked_at: new Date().toISOString(),
      },
    });
    if (metaErr) {
      console.error("[revokePremium] Fallback falhou:", metaErr.message);
      throw new Error("Não foi possível revogar Premium. Tente novamente.");
    }
  }

  await recordAuditLog({
    adminId: session.adminId,
    adminNome: session.nome,
    adminEmail: session.email,
    acao: "revoke_premium",
    descricao: "Revogou acesso Premium.",
    motivo: parsed.reason,
    ipSimulado,
    usuarioAfetadoId: target.id,
    usuarioAfetadoNome: target.nome,
  });

  return { ok: true, user: target };
}

export async function suspendUser(
  session: SessionPayload,
  userId: string,
  rawPayload: unknown,
  ipSimulado: string
): Promise<{ ok: true; user: PlatformUser }> {
  assertCan(session.papel, "users:suspend");
  const parsed = sensitiveReasonSchema.parse(rawPayload);

  const target = await getUser(session.papel, userId);
  if (!target) throw new Error("Usuário não encontrado.");

  target.status = "suspenso";

  try {
    const adminClient = createAdminClient();
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: "876000h",
      user_metadata: { is_suspended: true, suspended_at: new Date().toISOString() },
    });
  } catch {}

  await recordAuditLog({
    adminId: session.adminId,
    adminNome: session.nome,
    adminEmail: session.email,
    acao: "suspend_user",
    descricao: "Suspendeu conta de usuário.",
    motivo: parsed.reason,
    ipSimulado,
    usuarioAfetadoId: target.id,
    usuarioAfetadoNome: target.nome,
  });

  return { ok: true, user: target };
}

export async function reactivateUser(
  session: SessionPayload,
  userId: string,
  rawPayload: unknown,
  ipSimulado: string
): Promise<{ ok: true; user: PlatformUser }> {
  assertCan(session.papel, "users:suspend");
  const parsed = sensitiveReasonSchema.parse(rawPayload);

  const target = await getUser(session.papel, userId);
  if (!target) throw new Error("Usuário não encontrado.");

  target.status = "ativo";

  try {
    const adminClient = createAdminClient();
    await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: "none",
      user_metadata: { is_suspended: false, reactivated_at: new Date().toISOString() },
    });
  } catch {}

  await recordAuditLog({
    adminId: session.adminId,
    adminNome: session.nome,
    adminEmail: session.email,
    acao: "reactivate_user",
    descricao: "Reativou conta suspensa.",
    motivo: parsed.reason,
    ipSimulado,
    usuarioAfetadoId: target.id,
    usuarioAfetadoNome: target.nome,
  });

  return { ok: true, user: target };
}

export async function resetUserPassword(
  session: SessionPayload,
  userId: string,
  rawPayload: unknown,
  ipSimulado: string
): Promise<{ ok: true; message: string }> {
  assertCan(session.papel, "users:reset_password");
  const parsed = sensitiveReasonSchema.parse(rawPayload);

  const target = await getUser(session.papel, userId);
  if (!target) throw new Error("Usuário não encontrado.");

  try {
    const adminClient = createAdminClient();
    await adminClient.auth.resetPasswordForEmail(target.email);
  } catch {}

  await recordAuditLog({
    adminId: session.adminId,
    adminNome: session.nome,
    adminEmail: session.email,
    acao: "reset_password",
    descricao: `Disparou redefinição de senha para ${target.email}.`,
    motivo: parsed.reason,
    ipSimulado,
    usuarioAfetadoId: target.id,
    usuarioAfetadoNome: target.nome,
  });

  return {
    ok: true,
    message: `Link de redefinição enviado com sucesso para ${target.email}.`,
  };
}

export async function deleteUserAnonymize(
  session: SessionPayload,
  userId: string,
  rawPayload: unknown,
  ipSimulado: string
): Promise<{ ok: true }> {
  assertCan(session.papel, "users:delete");
  const parsed = deleteUserLgpdSchema.parse(rawPayload);

  // 1. Validar a senha do administrador logado antes de prosseguir
  const credentialCheck = await verifyAdminCredentials(session.email, parsed.adminPassword);
  if (
    !credentialCheck.ok ||
    credentialCheck.admin.id !== session.adminId ||
    credentialCheck.admin.papel !== session.papel
  ) {
    throw new Error("Senha de administrador incorreta. A exclusão foi cancelada.");
  }

  const target = await getUser(session.papel, userId);
  if (!target) throw new Error("Usuário não encontrado.");

  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) throw new Error("Não foi possível excluir o usuário.");

  await recordAuditLog({
    adminId: session.adminId,
    adminNome: session.nome,
    adminEmail: session.email,
    acao: "delete_user_lgpd",
    descricao: `Anonimizou/excluiu usuário sob solicitação LGPD. Protocolo: ${parsed.protocolNumber ?? "LGPD-MANUAL"}. Confirmado com senha.`,
    motivo: parsed.reason,
    ipSimulado,
    usuarioAfetadoId: target.id,
    usuarioAfetadoNome: target.nome,
  });

  return { ok: true };
}

export async function addUserNote(
  session: SessionPayload,
  userId: string,
  rawPayload: unknown
): Promise<{ ok: true; note: { id: string; adminId: string; adminNome: string; conteudo: string; criadoEm: string } }> {
  assertCan(session.papel, "users:add_note");
  const parsed = addNoteSchema.parse(rawPayload);

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("admin_notes")
    .insert({
      user_id: userId,
      author_id: session.adminId,
      author_name: session.nome,
      author_email: session.email,
      content: parsed.conteudo,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Erro ao salvar nota interna.");
  }

  return {
    ok: true,
    note: {
      id: data.id,
      adminId: data.author_id,
      adminNome: data.author_name,
      conteudo: data.content,
      criadoEm: data.created_at,
    },
  };
}
