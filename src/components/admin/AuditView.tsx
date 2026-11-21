"use client";

import { Download } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { downloadCsv, formatDateTimeBR } from "@/lib/admin/format";
import { can } from "@/lib/admin/rbac";
import type { AdminRole, AuditActionType, AuditLogEntry } from "@/lib/admin/types";
import { EmptyState, ErrorState, FeedbackBanner, TableSkeleton } from "./FeedbackBanner";

interface AuditResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_LABELS: Record<AuditActionType, string> = {
  login_success: "Login realizado",
  login_failed: "Falha de login",
  logout: "Logout",
  premium_granted: "Premium concedido",
  premium_revoked: "Premium revogado",
  premium_extended: "Premium estendido",
  user_suspended: "Conta suspensa",
  user_reactivated: "Conta reativada",
  user_password_reset: "Redefinição de senha",
  user_deleted_lgpd: "Exclusão LGPD",
  user_note_added: "Nota interna",
  admin_created: "Admin criado",
  admin_updated: "Admin atualizado",
  admin_toggled: "Status de admin alterado",
  settings_updated: "Configurações salvas",
  maintenance_toggled: "Modo manutenção",
  // Ações do data layer
  grant_premium: "Premium concedido (manual)",
  extend_premium: "Premium estendido (manual)",
  revoke_premium: "Premium revogado (manual)",
  suspend_user: "Conta suspensa",
  reactivate_user: "Conta reativada",
  reset_password: "Redefinição de senha enviada",
  delete_user_lgpd: "Exclusão LGPD",
  add_note: "Nota interna adicionada",
  admin_update_profile: "Perfil de admin atualizado",
};

export function AuditView({ actorRole }: { actorRole: AdminRole }) {
  const [adminQuery, setAdminQuery] = useState("");
  const [action, setAction] = useState<AuditActionType | "all">("all");
  const [userQuery, setUserQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<AuditResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const buildQuery = useCallback(
    (targetPage: number, pageSize = 20) => {
      const params = new URLSearchParams();
      if (adminQuery.trim()) params.set("adminQuery", adminQuery.trim());
      if (action !== "all") params.set("action", action);
      if (userQuery.trim()) params.set("userQuery", userQuery.trim());
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(targetPage));
      params.set("pageSize", String(pageSize));
      return params.toString();
    },
    [adminQuery, action, userQuery, dateFrom, dateTo]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit?${buildQuery(page, 20)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar auditoria.");
      setData(json as AuditResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, [buildQuery, page]);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/audit?${buildQuery(page, 20)}`);
        const json = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(json.error ?? "Erro ao carregar auditoria.");
          setData(json as AuditResponse);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Erro inesperado.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => { ignore = true; };
  }, [buildQuery, page]);

  async function handleExportCsv() {
    setExportMsg(null);
    const res = await fetch(`/api/admin/audit?${buildQuery(1, 200)}`);
    const json = (await res.json()) as AuditResponse;
    if (!res.ok) return;
    downloadCsv(
      "auditoria-meta-aprovacao.csv",
      ["ID", "Data/Hora", "Admin", "E-mail Admin", "Ação", "Descrição", "Motivo", "Usuário Afetado", "IP Simulado"],
      json.items.map((a) => [
        a.id,
        formatDateTimeBR(a.criadoEm),
        a.adminNome,
        a.adminEmail,
        ACTION_LABELS[a.acao] ?? a.acao,
        a.descricao,
        a.motivo ?? "—",
        a.usuarioAfetadoNome ?? "—",
        a.ipSimulado,
      ])
    );
    setExportMsg(`${json.items.length} registro(s) de auditoria exportado(s).`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-[32px] md:text-[36px] leading-tight">
            Auditoria
          </h1>
          <p className="text-[var(--text-secondary)] text-base mt-1">
            Registro imutável e somente leitura de ações administrativas, logins e falhas.
          </p>
        </div>

        {can(actorRole, "audit:export") && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] text-sm font-semibold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        )}
      </div>

      {exportMsg && (
        <FeedbackBanner type="success" message={exportMsg} onClose={() => setExportMsg(null)} />
      )}

      {/* Filtros */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label htmlFor="a-admin" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Administrador
          </label>
          <input
            id="a-admin"
            type="search"
            value={adminQuery}
            onChange={(e) => {
              setAdminQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Nome ou e-mail"
            className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
          />
        </div>

        <div>
          <label htmlFor="a-action" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Tipo de ação
          </label>
          <select
            id="a-action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value as AuditActionType | "all");
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
          >
            <option value="all">Todas as ações</option>
            {(Object.keys(ACTION_LABELS) as AuditActionType[]).map((key) => (
              <option key={key} value={key}>
                {ACTION_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="a-user" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Usuário afetado
          </label>
          <input
            id="a-user"
            type="search"
            value={userQuery}
            onChange={(e) => {
              setUserQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Nome ou ID"
            className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
          />
        </div>

        <div>
          <label htmlFor="a-from" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            De
          </label>
          <input
            id="a-from"
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
          />
        </div>

        <div>
          <label htmlFor="a-to" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Até
          </label>
          <input
            id="a-to"
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
          />
        </div>
      </section>

      {loading && <TableSkeleton rows={8} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data && data.items.length === 0 && (
        <EmptyState
          title="Nenhum registro encontrado"
          description="Ajuste os filtros de período, administrador ou tipo de ação."
        />
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <th className="p-3.5 font-medium">Quando</th>
                  <th className="p-3.5 font-medium">Quem</th>
                  <th className="p-3.5 font-medium">O quê</th>
                  <th className="p-3.5 font-medium">Usuário afetado</th>
                  <th className="p-3.5 font-medium">IP simulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.items.map((entry) => (
                  <tr key={entry.id}>
                    <td className="p-3.5 whitespace-nowrap text-[var(--text-secondary)]">
                      {formatDateTimeBR(entry.criadoEm)}
                    </td>
                    <td className="p-3.5">
                      <p className="font-medium">{entry.adminNome}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{entry.adminEmail}</p>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${
                          entry.acao === "login_failed" || entry.acao === "user_deleted_lgpd"
                            ? "bg-[var(--error-bg)] text-[var(--error-text)]"
                            : "bg-[var(--primary-subtle)] text-[var(--primary)]"
                        }`}
                      >
                        {ACTION_LABELS[entry.acao] ?? entry.acao}
                      </span>
                      <p className="text-[var(--text)]">{entry.descricao}</p>
                      {entry.motivo && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Motivo: {entry.motivo}
                        </p>
                      )}
                    </td>
                    <td className="p-3.5 text-[var(--text-secondary)]">
                      {entry.usuarioAfetadoNome ?? "—"}
                    </td>
                    <td className="p-3.5 font-mono text-xs text-[var(--text-secondary)]">
                      {entry.ipSimulado}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {data.items.map((entry) => (
              <div
                key={entry.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-1.5"
              >
                <div className="flex justify-between gap-2 text-xs text-[var(--text-secondary)]">
                  <span>{formatDateTimeBR(entry.criadoEm)}</span>
                  <span className="font-mono">{entry.ipSimulado}</span>
                </div>
                <p className="font-semibold text-base">{ACTION_LABELS[entry.acao] ?? entry.acao}</p>
                <p className="text-sm">{entry.descricao}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Por: {entry.adminNome} · Afetado: {entry.usuarioAfetadoNome ?? "—"}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Página {data.page} de {data.totalPages} ({data.total} eventos)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-medium disabled:opacity-40 cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-medium disabled:opacity-40 cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
