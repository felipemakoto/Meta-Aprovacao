"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatCurrencyBRL, formatDateBR } from "@/lib/admin/format";
import type { SubscriptionRecord } from "@/lib/admin/types";
import { EmptyState, ErrorState, TableSkeleton } from "./FeedbackBanner";

interface SubscriptionsResponse {
  items: SubscriptionRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export function SubscriptionsView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [origin, setOrigin] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<SubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status !== "all") params.set("status", status);
      if (origin !== "all") params.set("origin", origin);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", String(page));
      params.set("pageSize", "15");

      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar assinaturas.");
      setData(json as SubscriptionsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, [search, status, origin, dateFrom, dateTo, page]);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (status !== "all") params.set("status", status);
        if (origin !== "all") params.set("origin", origin);
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        params.set("page", String(page));
        params.set("pageSize", "15");

        const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
        const json = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(json.error ?? "Erro ao carregar assinaturas.");
          setData(json as SubscriptionsResponse);
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
  }, [search, status, origin, dateFrom, dateTo, page]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif-display text-[32px] md:text-[36px] leading-tight">
          Assinaturas e pagamentos
        </h1>
        <p className="text-[var(--text-secondary)] text-base mt-1">
          Acompanhe cobranças do gateway Cakto e concessões manuais. Dados de cartão nunca são armazenados.
        </p>
      </div>

      {/* Filtros */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label htmlFor="s-search" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Buscar (estudante ou ID)
          </label>
          <input
            id="s-search"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Nome, ID ou cak_..."
            className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
          />
        </div>

        <div>
          <label htmlFor="s-status" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Status
          </label>
          <select
            id="s-status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
          >
            <option value="all">Todos</option>
            <option value="ativa">Ativa</option>
            <option value="cancelada">Cancelada</option>
            <option value="expirada">Expirada</option>
            <option value="em_atraso">Em atraso</option>
          </select>
        </div>

        <div>
          <label htmlFor="s-origin" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Origem
          </label>
          <select
            id="s-origin"
            value={origin}
            onChange={(e) => {
              setOrigin(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
          >
            <option value="all">Todas</option>
            <option value="cakto">Cakto</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <div>
          <label htmlFor="s-from" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Início a partir de
          </label>
          <input
            id="s-from"
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
          <label htmlFor="s-to" className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Início até
          </label>
          <input
            id="s-to"
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
          title="Nenhuma assinatura encontrada"
          description="Tente alterar os filtros de status, origem ou período."
        />
      )}

      {!loading && !error && data && data.items.length > 0 && (
        <>
          <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <th className="p-3.5 font-medium">Estudante</th>
                  <th className="p-3.5 font-medium">Plano</th>
                  <th className="p-3.5 font-medium">Origem</th>
                  <th className="p-3.5 font-medium">Status</th>
                  <th className="p-3.5 font-medium">Valor</th>
                  <th className="p-3.5 font-medium">Período</th>
                  <th className="p-3.5 font-medium">ID Externo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {data.items.map((s) => (
                  <tr key={s.id} className="hover:bg-[var(--primary-subtle)]/40">
                    <td className="p-3.5">
                      <Link
                        href={`/admin/usuarios/${s.userId}`}
                        className="font-medium text-[var(--primary)] hover:underline"
                      >
                        {s.userNome}
                      </Link>
                      <p className="text-xs text-[var(--text-secondary)]">{s.userId}</p>
                    </td>
                    <td className="p-3.5">{s.planoNome}</td>
                    <td className="p-3.5">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium uppercase bg-[var(--bg)] border border-[var(--border)]">
                        {s.origem}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          s.status === "ativa"
                            ? "bg-[var(--primary-subtle)] text-[var(--primary)]"
                            : s.status === "em_atraso"
                              ? "bg-[var(--warn-bg)] text-[var(--warn-text)]"
                              : "bg-[var(--error-bg)] text-[var(--error-text)]"
                        }`}
                      >
                        {s.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium">{formatCurrencyBRL(s.valorCentavos)}</td>
                    <td className="p-3.5 text-[var(--text-secondary)]">
                      {formatDateBR(s.inicioEm)} → {s.vitalicio ? "Vitalício" : formatDateBR(s.expiraEm)}
                    </td>
                    <td className="p-3.5 font-mono text-xs">
                      {s.gatewayUrl ? (
                        <a
                          href={s.gatewayUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
                        >
                          {s.externalId}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-[var(--text-secondary)]">{s.externalId}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {data.items.map((s) => (
              <div
                key={s.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-2"
              >
                <div className="flex justify-between gap-2">
                  <p className="font-semibold text-base truncate">{s.userNome}</p>
                  <span className="font-semibold text-base shrink-0">
                    {formatCurrencyBRL(s.valorCentavos)}
                  </span>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">{s.planoNome}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full border border-[var(--border)] uppercase">
                    {s.origem}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] capitalize">
                    {s.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  ID: {s.externalId}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-sm text-[var(--text-secondary)]">
              Página {data.page} de {data.totalPages} ({data.total} registros)
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
