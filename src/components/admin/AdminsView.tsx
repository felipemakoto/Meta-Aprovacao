"use client";

import { UserPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatDateTimeBR } from "@/lib/admin/format";
import { ROLE_LABELS } from "@/lib/admin/rbac";
import { createAdminSchema } from "@/lib/admin/schemas";
import type { AdminAccount, AdminRole } from "@/lib/admin/types";
import { EmptyState, ErrorState, FeedbackBanner, TableSkeleton } from "./FeedbackBanner";

export function AdminsView({ currentAdminId }: { currentAdminId: string }) {
  const [items, setItems] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<AdminRole>("suporte");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/admins");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar administradores.");
      setItems(json.items as AdminAccount[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/admins");
        const json = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(json.error ?? "Erro ao carregar administradores.");
          setItems(json.items as AdminAccount[]);
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
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const parsed = createAdminSchema.safeParse({ nome, email, papel });
    if (!parsed.success) {
      setFeedback({ type: "error", text: parsed.error.issues[0]?.message ?? "Dados inválidos." });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao criar administrador.");
      setNome("");
      setEmail("");
      setFeedback({ type: "success", text: json.message });
      await load();
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao criar." });
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(id: string, newRole: AdminRole) {
    setFeedback(null);
    const res = await fetch("/api/admin/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "update_role", papel: newRole }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ type: "error", text: json.error ?? "Erro ao alterar papel." });
      return;
    }
    setFeedback({ type: "success", text: json.message });
    await load();
  }

  async function handleToggleStatus(id: string) {
    setFeedback(null);
    const res = await fetch("/api/admin/admins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "toggle_status" }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFeedback({ type: "error", text: json.error ?? "Erro ao alterar status." });
      return;
    }
    setFeedback({ type: "success", text: json.message });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-display text-[32px] md:text-[36px] leading-tight">
          Gestão de administradores
        </h1>
        <p className="text-[var(--text-secondary)] text-base mt-1">
          Crie contas administrativas, defina papéis RBAC e acompanhe o último acesso.
        </p>
      </div>

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.text}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Formulário de criação */}
      <form
        onSubmit={handleCreate}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4"
      >
        <h2 className="font-semibold text-lg">Novo administrador</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label htmlFor="adm-nome" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Nome completo
            </label>
            <input
              id="adm-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Beatriz Almeida"
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-base"
              required
            />
          </div>
          <div>
            <label htmlFor="adm-email" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              E-mail
            </label>
            <input
              id="adm-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="beatriz@metaaprovacao.com.br"
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-base"
              required
            />
          </div>
          <div>
            <label htmlFor="adm-role" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Papel
            </label>
            <select
              id="adm-role"
              value={papel}
              onChange={(e) => setPapel(e.target.value as AdminRole)}
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-base"
            >
              <option value="super_admin">Super Admin</option>
              <option value="suporte">Suporte</option>
              <option value="financeiro">Financeiro</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="min-h-[44px] px-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] text-sm font-semibold cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {creating ? "Criando..." : "Adicionar"}
          </button>
        </div>
      </form>

      {loading && <TableSkeleton rows={4} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="Nenhum administrador" description="Adicione o primeiro administrador acima." />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] text-[var(--text-secondary)]">
              <tr>
                <th className="p-3.5 font-medium">Administrador</th>
                <th className="p-3.5 font-medium">Papel</th>
                <th className="p-3.5 font-medium">Status</th>
                <th className="p-3.5 font-medium">Último acesso</th>
                <th className="p-3.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((adm) => (
                <tr key={adm.id}>
                  <td className="p-3.5">
                    <p className="font-medium">{adm.nome}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{adm.email}</p>
                  </td>
                  <td className="p-3.5">
                    <select
                      aria-label={`Papel de ${adm.nome}`}
                      value={adm.papel}
                      onChange={(e) => handleRoleChange(adm.id, e.target.value as AdminRole)}
                      className="min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
                    >
                      {(Object.keys(ROLE_LABELS) as AdminRole[]).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        adm.ativo
                          ? "bg-[var(--primary-subtle)] text-[var(--primary)]"
                          : "bg-[var(--error-bg)] text-[var(--error-text)]"
                      }`}
                    >
                      {adm.ativo ? "Ativo" : "Desativado"}
                    </span>
                  </td>
                  <td className="p-3.5 text-[var(--text-secondary)]">
                    {formatDateTimeBR(adm.ultimoAcessoEm)}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      disabled={adm.id === currentAdminId}
                      onClick={() => handleToggleStatus(adm.id)}
                      className="min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] hover:bg-[var(--primary-subtle)] text-sm font-medium disabled:opacity-40 cursor-pointer"
                    >
                      {adm.ativo ? "Desativar" : "Reativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
