"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatCurrencyBRL, formatDateBR, formatDateTimeBR } from "@/lib/admin/format";
import { can } from "@/lib/admin/rbac";
import { addNoteSchema } from "@/lib/admin/schemas";
import type { AdminRole, PlatformUser, SubscriptionRecord } from "@/lib/admin/types";
import { ErrorState, FeedbackBanner, TableSkeleton } from "./FeedbackBanner";
import { UserActionModal, type UserModalAction } from "./UserActionModal";

interface UserDetailResponse {
  user: PlatformUser;
  subscriptions: SubscriptionRecord[];
  hasActiveCakto: boolean;
  caktoWarning: string | null;
}

export function UserDetailView({
  userId,
  actorRole,
}: {
  userId: string;
  actorRole: AdminRole;
}) {
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeModal, setActiveModal] = useState<UserModalAction | null>(null);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar estudante.");
      setData(json as UserDetailResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/users/${userId}`);
        const json = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(json.error ?? "Erro ao carregar estudante.");
          setData(json as UserDetailResponse);
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
  }, [userId]);

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    const parsed = addNoteSchema.safeParse({ conteudo: noteText });
    if (!parsed.success) {
      setFeedback({ type: "error", text: parsed.error.issues[0]?.message ?? "Nota inválida." });
      return;
    }
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_note", payload: parsed.data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar nota.");
      setNoteText("");
      setFeedback({ type: "success", text: json.message ?? "Nota registrada." });
      await load();
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar nota." });
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) return <TableSkeleton rows={6} />;
  if (error || !data) {
    return <ErrorState message={error ?? "Estudante não encontrado."} onRetry={load} />;
  }

  const { user, subscriptions, hasActiveCakto, caktoWarning } = data;
  if (!user) {
    return <ErrorState message="Usuário não encontrado ou sem permissão de acesso." onRetry={load} />;
  }
  const isDeleted = user.status === "excluido";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/usuarios"
          className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para usuários
        </Link>
        <h1 className="font-serif-display text-[32px] md:text-[36px] leading-tight">
          {user.nome}
        </h1>
        <p className="text-[var(--text-secondary)] text-base">
          {user.id} · {user.email}
        </p>
      </div>

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.text}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Dados cadastrais e Ações */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-lg">Dados cadastrais e plano</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm md:text-base">
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">CPF (mascarado)</dt>
              <dd className="font-medium">{user.cpfMascarado}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Telefone</dt>
              <dd className="font-medium">{user.telefone}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Plano atual</dt>
              <dd className="font-medium capitalize">
                {user.plano} {user.premiumVitalicio ? "(Vitalício)" : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Origem do Premium</dt>
              <dd className="font-medium uppercase">{user.origemPremium ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Início do Premium</dt>
              <dd>{formatDateBR(user.premiumInicioEm)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Expiração do Premium</dt>
              <dd>{user.premiumVitalicio ? "Vitalício" : formatDateBR(user.premiumExpiraEm)}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Status da conta</dt>
              <dd className="font-medium capitalize">{user.status}</dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-secondary)]">Cadastro / Último acesso</dt>
              <dd>
                {formatDateBR(user.criadoEm)} · {formatDateBR(user.ultimaAtividadeEm)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-2.5">
          <h2 className="font-semibold text-lg mb-2">Ações administrativas</h2>
          {isDeleted ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Conta anonimizada conforme a LGPD. Nenhuma alteração disponível.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {can(actorRole, "users:grant_premium") && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveModal("grant_premium")}
                    className="min-h-[44px] px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] text-sm font-semibold text-left cursor-pointer"
                  >
                    Conceder Premium
                  </button>
                  {user.plano === "premium" && !user.premiumVitalicio && (
                    <button
                      type="button"
                      onClick={() => setActiveModal("extend_premium")}
                      className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--primary-subtle)] text-sm font-medium text-left cursor-pointer"
                    >
                      Estender Premium
                    </button>
                  )}
                </>
              )}
              {can(actorRole, "users:revoke_premium") && user.plano === "premium" && (
                <button
                  type="button"
                  onClick={() => setActiveModal("revoke_premium")}
                  className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--error-bg)] text-[var(--error-text)] text-sm font-medium text-left cursor-pointer"
                >
                  Revogar Premium
                </button>
              )}
              {can(actorRole, "users:suspend") && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveModal(user.status === "suspenso" ? "reactivate" : "suspend")
                  }
                  className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--warn-bg)] text-sm font-medium text-left cursor-pointer"
                >
                  {user.status === "suspenso" ? "Reativar conta" : "Suspender conta"}
                </button>
              )}
              {can(actorRole, "users:reset_password") && (
                <button
                  type="button"
                  onClick={() => setActiveModal("reset_password")}
                  className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--primary-subtle)] text-sm font-medium text-left cursor-pointer"
                >
                  Redefinir senha (simular e-mail)
                </button>
              )}
              {can(actorRole, "users:delete") && (
                <button
                  type="button"
                  onClick={() => setActiveModal("delete_lgpd")}
                  className="min-h-[44px] px-4 rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)] text-sm font-semibold text-left cursor-pointer"
                >
                  Excluir conta (LGPD)
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Assinaturas e pagamentos */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-lg">Histórico de assinaturas e pagamentos</h2>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">Nenhuma assinatura registrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                <tr>
                  <th className="py-2 pr-4 font-medium">Plano</th>
                  <th className="py-2 pr-4 font-medium">Origem</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Valor</th>
                  <th className="py-2 pr-4 font-medium">Período</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {subscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 pr-4 font-medium">{s.planoNome}</td>
                    <td className="py-2.5 pr-4 uppercase text-xs">{s.origem}</td>
                    <td className="py-2.5 pr-4 capitalize">{s.status.replace("_", " ")}</td>
                    <td className="py-2.5 pr-4">{formatCurrencyBRL(s.valorCentavos)}</td>
                    <td className="py-2.5 pr-4 text-[var(--text-secondary)]">
                      {formatDateBR(s.inicioEm)} → {s.vitalicio ? "Vitalício" : formatDateBR(s.expiraEm)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Simulados e Desempenho */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-lg">Histórico de simulados</h2>
          <div className="space-y-2">
            {user.simulados.map((sim) => (
              <div
                key={sim.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm"
              >
                <div>
                  <p className="font-medium">{sim.titulo}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {formatDateBR(sim.data)} · {sim.tempoGastoMinutos} min · {sim.acertos}/{sim.totalQuestoes} acertos
                  </p>
                </div>
                <span className="font-serif-display text-2xl text-[var(--primary)]">
                  {sim.nota.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-lg">Desempenho por assunto e questões erradas</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {user.desempenhoPorAssunto.map((perf, idx) => (
              <div key={idx} className="flex justify-between text-sm border-b border-[var(--border)] pb-1.5">
                <span>
                  <strong>{perf.materia}:</strong> {perf.assunto}
                </span>
                <span className="text-[var(--text-secondary)] shrink-0 ml-2">
                  {perf.acertos}/{perf.totalRespondidas} ({perf.erros} erros)
                </span>
              </div>
            ))}
          </div>
          {user.questoesErradas.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1.5">
                Últimas questões erradas
              </p>
              <ul className="space-y-1.5 text-sm">
                {user.questoesErradas.slice(0, 4).map((q) => (
                  <li key={q.id} className="text-[var(--text-secondary)]">
                    • {q.enunciadoResumo}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Logins e Notas */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-lg">Histórico de logins</h2>
          <ul className="space-y-2 text-sm">
            {user.historicoLogins.map((l) => (
              <li key={l.id} className="flex justify-between gap-2 border-b border-[var(--border)] pb-2">
                <span>{l.dispositivo}</span>
                <span className="text-[var(--text-secondary)]">
                  {l.ip} · {formatDateTimeBR(l.data)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-lg">Notas internas do administrador</h2>
          {can(actorRole, "users:add_note") && (
            <form onSubmit={handleAddNote} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Adicionar observação interna..."
                className="flex-1 min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm md:text-base"
              />
              <button
                type="submit"
                disabled={savingNote}
                className="min-h-[44px] px-4 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] text-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                Salvar nota
              </button>
            </form>
          )}
          <div className="space-y-2">
            {user.notasInternas.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Nenhuma nota registrada.</p>
            ) : (
              user.notasInternas.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-sm">
                  <p>{n.conteudo}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {n.adminNome} · {formatDateTimeBR(n.criadoEm)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {activeModal && (
        <UserActionModal
          action={activeModal}
          userId={user.id}
          userName={user.nome}
          hasActiveCakto={hasActiveCakto}
          caktoWarning={caktoWarning}
          onClose={() => setActiveModal(null)}
          onSuccess={async (msg) => {
            setActiveModal(null);
            setFeedback({ type: "success", text: msg });
            await load();
          }}
        />
      )}
    </div>
  );
}
