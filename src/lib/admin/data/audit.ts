import { assertCan } from "../rbac";
import type { AdminRole, AuditActionType, AuditLogEntry } from "../types";
import { getStore } from "./store";

export interface ListAuditLogsParams {
  adminQuery?: string;
  action?: AuditActionType | "all";
  userQuery?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function recordAuditLog(
  entry: Omit<AuditLogEntry, "id" | "criadoEm">
): Promise<AuditLogEntry> {
  const store = getStore();
  // SUPABASE: await supabase.from("audit_logs").insert({ ...entry }).select().single();
  const created: AuditLogEntry = {
    ...entry,
    id: `AUD-${String(store.auditLogs.length + 1).padStart(4, "0")}`,
    criadoEm: new Date().toISOString(),
  };
  store.auditLogs.unshift(created);
  return created;
}

export async function listAuditLogs(
  actorRole: AdminRole,
  params: ListAuditLogsParams = {}
): Promise<PaginatedResult<AuditLogEntry>> {
  assertCan(actorRole, "audit:view");
  const store = getStore();
  // SUPABASE: const query = supabase.from("audit_logs").select("*", { count: "exact" });

  let filtered = [...store.auditLogs];

  if (params.adminQuery?.trim()) {
    const q = params.adminQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.adminNome.toLowerCase().includes(q) ||
        item.adminEmail.toLowerCase().includes(q)
    );
  }

  if (params.action && params.action !== "all") {
    filtered = filtered.filter((item) => item.acao === params.action);
  }

  if (params.userQuery?.trim()) {
    const q = params.userQuery.trim().toLowerCase();
    filtered = filtered.filter(
      (item) =>
        (item.usuarioAfetadoNome ?? "").toLowerCase().includes(q) ||
        (item.usuarioAfetadoId ?? "").toLowerCase().includes(q)
    );
  }

  if (params.dateFrom) {
    const fromMs = new Date(params.dateFrom).getTime();
    if (!Number.isNaN(fromMs)) {
      filtered = filtered.filter((item) => new Date(item.criadoEm).getTime() >= fromMs);
    }
  }

  if (params.dateTo) {
    const toMs = new Date(params.dateTo).getTime() + 86400000 - 1;
    if (!Number.isNaN(toMs)) {
      filtered = filtered.filter((item) => new Date(item.criadoEm).getTime() <= toMs);
    }
  }

  filtered.sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
  );

  const pageSize = Math.min(Math.max(params.pageSize ?? 20, 1), 200);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(params.page ?? 1, 1), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: filtered.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}
