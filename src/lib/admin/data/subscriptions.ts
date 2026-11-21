import { assertCan } from "../rbac";
import type {
  AdminRole,
  SubscriptionOrigin,
  SubscriptionRecord,
  SubscriptionStatus,
} from "../types";
import type { PaginatedResult } from "./audit";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ListSubscriptionsParams {
  search?: string;
  status?: SubscriptionStatus | "all";
  origin?: SubscriptionOrigin | "all";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function listSubscriptions(
  actorRole: AdminRole,
  params: ListSubscriptionsParams = {}
): Promise<PaginatedResult<SubscriptionRecord>> {
  assertCan(actorRole, "subscriptions:view");

  const adminClient = createAdminClient();

  // Tenta usar a RPC admin_list_subscriptions (disponível após a migration ser aplicada).
  // Se ainda não existir no banco, cai para a abordagem iterativa.
  let records: SubscriptionRecord[] = [];

  try {
    const { data: rows, error: rpcError } = await adminClient.rpc("admin_list_subscriptions");

    if (!rpcError && Array.isArray(rows)) {
      // RPC existe e respondeu — busca nomes dos usuários
      type SubscriptionRow = {
        id: string;
        user_id: string;
        provider: string;
        provider_status: string;
        access_state: string;
        access_from: string | null;
        access_until: string | null;
        external_subscription_id: string;
        created_at: string;
      };

      const typedRows = rows as SubscriptionRow[];

      // Carrega mapa de nomes/emails dos usuários
      const userMap: Record<string, { nome: string; email: string }> = {};
      const { data: authList } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      for (const u of authList?.users ?? []) {
        const nome =
          (u.user_metadata?.name as string) ||
          (u.user_metadata?.full_name as string) ||
          u.email?.split("@")[0] ||
          "Estudante";
        userMap[u.id] = { nome, email: u.email ?? "" };
      }

      records = typedRows.map((r) => {
        const user = userMap[r.user_id] ?? { nome: "—", email: "—" };
        const origem: SubscriptionOrigin = r.provider === "manual" ? "manual" : "cakto";
        const status: SubscriptionStatus =
          r.access_state === "revoked"
            ? "cancelada"
            : r.access_state === "granted"
              ? "ativa"
              : "expirada";

        return {
          id: r.id,
          userId: r.user_id,
          userNome: user.nome,
          userEmail: user.email,
          planoNome: origem === "manual" ? "Acesso Manual" : "Meta Aprovação Premium",
          valorCentavos: origem === "cakto" ? 2299 : 0,
          status,
          origem,
          externalId: r.external_subscription_id ?? r.id,
          gatewayUrl: null,
          inicioEm: r.access_from ?? r.created_at,
          expiraEm: r.access_until ?? null,
          vitalicio: false,
        };
      });
    } else {
      // Fallback: RPC não disponível no banco — usa listUsers + read_subscription_access
      // e também inclui concessões manuais salvas em user_metadata
      console.warn("[subscriptions] RPC indisponível, usando fallback:", rpcError?.message);
      records = await buildRecordsFromAuthUsers(adminClient);
    }
  } catch (ex) {
    // Fallback em caso de erro inesperado
    console.warn("[subscriptions] Exceção, tentando fallback:", ex);
    try {
      records = await buildRecordsFromAuthUsers(adminClient);
    } catch {
      throw new Error(
        "Não foi possível carregar assinaturas. Verifique a conexão com o Supabase."
      );
    }
  }

  // ── Filtros ──────────────────────────────────────────────────────────────
  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    records = records.filter(
      (s) =>
        s.userNome.toLowerCase().includes(q) ||
        s.userEmail.toLowerCase().includes(q) ||
        s.userId.toLowerCase().includes(q) ||
        s.externalId.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }

  if (params.status && params.status !== "all") {
    records = records.filter((s) => s.status === params.status);
  }

  if (params.origin && params.origin !== "all") {
    records = records.filter((s) => s.origem === params.origin);
  }

  if (params.dateFrom) {
    const fromMs = new Date(params.dateFrom).getTime();
    if (!Number.isNaN(fromMs)) {
      records = records.filter((s) => new Date(s.inicioEm).getTime() >= fromMs);
    }
  }

  if (params.dateTo) {
    const toMs = new Date(params.dateTo).getTime() + 86400000 - 1;
    if (!Number.isNaN(toMs)) {
      records = records.filter((s) => new Date(s.inicioEm).getTime() <= toMs);
    }
  }

  records.sort((a, b) => new Date(b.inicioEm).getTime() - new Date(a.inicioEm).getTime());

  // ── Paginação ─────────────────────────────────────────────────────────────
  const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 100);
  const total = records.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(params.page ?? 1, 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: records.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

async function buildRecordsFromAuthUsers(
  adminClient: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>
): Promise<SubscriptionRecord[]> {
  const { data: authList, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error || !authList?.users) return [];

  const records: SubscriptionRecord[] = [];

  await Promise.all(
    authList.users.map(async (u) => {
      const nome =
        (u.user_metadata?.name as string) ||
        (u.user_metadata?.full_name as string) ||
        u.email?.split("@")[0] ||
        "Estudante";

      // 1. Verifica via RPC (assinaturas Cakto no banco)
      try {
        const { data: access } = await adminClient.rpc("read_subscription_access", {
          p_user_id: u.id,
        });

        if (access?.hasPremium) {
          records.push({
            id: u.id,
            userId: u.id,
            userNome: nome,
            userEmail: u.email ?? "",
            planoNome: "Meta Aprovação Premium",
            valorCentavos: 2299,
            status: "ativa",
            origem: "cakto",
            externalId: u.id,
            gatewayUrl: null,
            inicioEm: u.created_at,
            expiraEm: access.accessUntil ?? null,
            vitalicio: false,
          });
          return; // Já adicionou via RPC, não duplica
        }
      } catch {
        // RPC indisponível — continua para verificar user_metadata
      }

      // 2. Verifica concessão manual via user_metadata (fallback do fallback)
      if (u.user_metadata?.manual_premium === true) {
        const expIso = u.user_metadata?.premium_access_until as string | null | undefined;
        const isRevoked = u.user_metadata?.premium_revoked_at && !u.user_metadata?.manual_premium;
        // Se foi revogado explicitamente, o campo manual_premium já é false — mas checamos mesmo assim
        const isExpired = expIso && new Date(expIso) < new Date();
        const status: SubscriptionStatus = isRevoked
          ? "cancelada"
          : isExpired
            ? "expirada"
            : "ativa";

        records.push({
          id: `meta_${u.id}`,
          userId: u.id,
          userNome: nome,
          userEmail: u.email ?? "",
          planoNome: "Acesso Manual",
          valorCentavos: 0,
          status,
          origem: "manual",
          externalId: `meta_${u.id}`,
          gatewayUrl: null,
          inicioEm: (u.user_metadata?.premium_granted_at as string | null) ?? u.created_at,
          expiraEm: expIso ?? null,
          vitalicio: !expIso,
        });
      }
    })
  );

  return records;
}
