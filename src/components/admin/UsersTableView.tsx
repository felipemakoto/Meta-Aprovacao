"use client";

import { ArrowUpDown, Download } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { downloadCsv, formatDateBR } from "@/lib/admin/format";
import type { PlatformUser } from "@/lib/admin/types";
import { EmptyState, ErrorState, FeedbackBanner, TableSkeleton } from "./FeedbackBanner";

interface UsersResponse {
  items: PlatformUser[];
  total: number;
  page: number;
  totalPages: number;
}

export function UsersTableView() {
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [activeFrom, setActiveFrom] = useState("");
  const [activeTo, setActiveTo] = useState("");
  const [sortBy, setSortBy] = useState<"nome" | "criadoEm" | "ultimaAtividadeEm" | "plano">("criadoEm");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const buildQuery = useCallback(
    (targetPage: number, pageSize = 15) => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (plan !== "all") params.set("plan", plan);
      if (status !== "all") params.set("status", status);
      if (createdFrom) params.set("createdFrom", createdFrom);
      if (createdTo) params.set("createdTo", createdTo);
      if (activeFrom) params.set("activeFrom", activeFrom);
      if (activeTo) params.set("activeTo", activeTo);
      params.set("sortBy", sortBy);
      params.set("sortDir", sortDir);
      params.set("page", String(targetPage));
      params.set("pageSize", String(pageSize));
      return params.toString();
    },
    [search, plan, status, createdFrom, createdTo, activeFrom, activeTo, sortBy, sortDir]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users?${buildQuery(page, 15)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar usuários.");
      setData(json as UsersResponse);
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
        const res = await fetch(`/api/admin/users?${buildQuery(page, 15)}`);
        const json = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(json.error ?? "Erro ao carregar usuários.");
          setData(json as UsersResponse);
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

  function toggleSort(col: typeof sortBy) {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
    setPage(1);
  }

  async function handleExportCsv() {
    setExportMsg(null);
    const res = await fetch(`/api/admin/users?${buildQuery(1, 500)}`);
    const json = (await res.json()) as UsersResponse;
    if (!res.ok) return;
    downloadCsv(
      "usuarios-meta-aprovacao.csv",
      ["ID", "Nome", "E-mail", "CPF", "Plano", "Status", "Origem Premium", "Cadastro", "Última Atividade"],
      json.items.map((u) => [
        u.id,
        u.nome,
        u.email,
        u.cpfMascarado,
        u.plano,
        u.status,
        u.origemPremium ?? "—",
        formatDateBR(u.criadoEm),
        formatDateBR(u.ultimaAtividadeEm),
      ])
    );
    setExportMsg(`${json.items.length} usuário(s) exportado(s) em CSV.`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-[32px] md:text-[36px] leading-tight">
            Usuários
          </h1>
          <p className="text-[var(--text-secondary)] text-base mt-1">
            Gerencie contas de estudantes, planos e histórico de estudos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] text-sm font-semibold cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {exportMsg && (
        <FeedbackBanner type="success" message={exportMsg} onClose={() => setExportMsg(null)} />
      )}

      {/* Filtros */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="u-search" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Buscar (nome, e-mail ou ID)
            </label>
            <input
              id="u-search"
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Ex.: Ana ou USR-0001"
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
            />
          </div>

          <div>
            <label htmlFor="u-plan" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Plano
            </label>
            <select
              id="u-plan"
              value={plan}
              onChange={(e) => {
                setPlan(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
            >
              <option value="all">Todos os planos</option>
              <option value="premium">Premium</option>
              <option value="gratis">Grátis</option>
            </select>
          </div>

          <div>
            <label htmlFor="u-status" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Status
            </label>
            <select
              id="u-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
            >
              <option value="all">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="excluido">Excluído (LGPD)</option>
            </select>
          </div>

          <div>
            <label htmlFor="u-created-from" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Cadastro a partir de
            </label>
            <input
              id="u-created-from"
              type="date"
              value={createdFrom}
              onChange={(e) => {
                setCreatedFrom(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="u-created-to" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Cadastro até
            </label>
            <input
              id="u-created-to"
              type="date"
              value={createdTo}
              onChange={(e) => {
                setCreatedTo(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
            />
          </div>
          <div>
            <label htmlFor="u-active-from" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Última atividade de
            </label>
            <input
              id="u-active-from"
              type="date"
              value={activeFrom}
              onChange={(e) => {
                setActiveFrom(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
            />
          </div>
          <div>
            <label htmlFor="u-active-to" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Última atividade até
            </label>
            <input
              id="u-active-to"
              type="date"
              value={activeTo}
              onChange={(e) => {
                setActiveTo(e.target.value);
                setPage(1);
              }}
              className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm"
            />
          </div>
        </div>
      </section>

      {loading && <TableSkeleton rows={8} />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && data && data.items.length === 0 && (
        <EmptyState
          title="Nenhum usuário encontrado"
          description="Ajuste os filtros de busca, plano ou datas para visualizar resultados."
        />
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          {/* Tabela Desktop/Tablet */}
          <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <th className="p-3.5 font-medium">ID</th>
                  <th className="p-3.5 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("nome")}
                      className="min-h-[44px] inline-flex items-center gap-1 font-medium cursor-pointer"
                    >
                      Estudante <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="p-3.5 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("plano")}
                      className="min-h-[44px] inline-flex items-center gap-1 font-medium cursor-pointer"
                    >
                      Plano <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="p-3.5 font-medium">Status</th>
                  <th className="p-3.5 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("criadoEm")}
                      className="min-h-[44px] inline-flex items-center gap-1 font-medium cursor-pointer"
                    >
                      Cadastro <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="p-3.5 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort("ultimaAtividadeEm")}
                      className="min-h-[44px] inline-flex items-center gap-1 font-medium cursor-pointer"
                    >
                      Última atividade <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="p-3.5 font-medium text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--primary-subtle)]/40">
                    <td className="p-3.5 font-mono text-xs text-[var(--text-secondary)]">{u.id}</td>
                    <td className="p-3.5">
                      <p className="font-medium text-[var(--text)]">{u.nome}</p>
                      <p className="text-[var(--text-secondary)] text-xs">{u.email}</p>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.plano === "premium"
                            ? "bg-[var(--primary-subtle)] text-[var(--primary)]"
                            : "bg-[var(--bg)] text-[var(--text-secondary)] border border-[var(--border)]"
                        }`}
                      >
                        {u.plano === "premium" ? "Premium" : "Grátis"}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.status === "ativo"
                            ? "bg-[var(--primary-subtle)] text-[var(--primary)]"
                            : u.status === "suspenso"
                              ? "bg-[var(--warn-bg)] text-[var(--warn-text)]"
                              : "bg-[var(--error-bg)] text-[var(--error-text)]"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-[var(--text-secondary)]">{formatDateBR(u.criadoEm)}</td>
                    <td className="p-3.5 text-[var(--text-secondary)]">{formatDateBR(u.ultimaAtividadeEm)}</td>
                    <td className="p-3.5 text-right">
                      <Link
                        href={`/admin/usuarios/${u.id}`}
                        className="min-h-[44px] px-3 inline-flex items-center rounded-xl border border-[var(--border)] hover:bg-[var(--primary-subtle)] font-medium text-sm"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista empilhada Mobile (320px+) */}
          <div className="md:hidden space-y-3">
            {data.items.map((u) => (
              <div
                key={u.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-base text-[var(--text)] truncate">{u.nome}</p>
                    <p className="text-sm text-[var(--text-secondary)] truncate">{u.email}</p>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-secondary)] shrink-0">{u.id}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] font-medium">
                    {u.plano === "premium" ? "Premium" : "Grátis"}
                  </span>
                  <span className="px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                    {u.status}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--text-secondary)]">
                    Cadastro: {formatDateBR(u.criadoEm)}
                  </span>
                  <Link
                    href={`/admin/usuarios/${u.id}`}
                    className="min-h-[44px] px-4 inline-flex items-center rounded-xl bg-[var(--primary)] text-[var(--primary-text)] text-sm font-medium"
                  >
                    Gerenciar
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Página {data.page} de {data.totalPages} ({data.total} usuários)
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
