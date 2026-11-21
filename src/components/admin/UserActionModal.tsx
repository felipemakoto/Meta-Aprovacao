"use client";

import { X } from "lucide-react";
import { useState } from "react";
import {
  deleteUserLgpdSchema,
  extendPremiumSchema,
  grantPremiumSchema,
  sensitiveReasonSchema,
} from "@/lib/admin/schemas";
import { FeedbackBanner } from "./FeedbackBanner";

export type UserModalAction =
  | "grant_premium"
  | "extend_premium"
  | "revoke_premium"
  | "suspend"
  | "reactivate"
  | "reset_password"
  | "delete_lgpd";

const ACTION_TITLES: Record<UserModalAction, string> = {
  grant_premium: "Conceder acesso Premium",
  extend_premium: "Estender acesso Premium",
  revoke_premium: "Revogar acesso Premium",
  suspend: "Suspender conta do estudante",
  reactivate: "Reativar conta do estudante",
  reset_password: "Enviar redefinição de senha",
  delete_lgpd: "Excluir e anonimizar conta (LGPD)",
};

export function UserActionModal({
  action,
  userId,
  userName,
  hasActiveCakto,
  caktoWarning,
  onClose,
  onSuccess,
}: {
  action: UserModalAction;
  userId: string;
  userName: string;
  hasActiveCakto: boolean;
  caktoWarning: string | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [durationType, setDurationType] = useState<"7" | "30" | "90" | "365" | "custom" | "lifetime">("30");
  const [extendDays, setExtendDays] = useState<"7" | "30" | "90" | "365">("30");
  const [customDate, setCustomDate] = useState("");
  const [reason, setReason] = useState("");
  const [confirmCakto, setConfirmCakto] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let payload: Record<string, unknown> = { reason };

    if (action === "grant_premium") {
      const parsed = grantPremiumSchema.safeParse({
        durationType,
        customDate: durationType === "custom" ? customDate : undefined,
        reason,
        confirmCaktoConflict: confirmCakto,
      });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
        return;
      }
      if (hasActiveCakto && !confirmCakto) {
        setError("Confirme o aviso de assinatura Cakto ativa antes de prosseguir.");
        return;
      }
      payload = parsed.data;
    } else if (action === "extend_premium") {
      const parsed = extendPremiumSchema.safeParse({ days: extendDays, reason });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
        return;
      }
      payload = parsed.data;
    } else if (action === "delete_lgpd") {
      const parsed = deleteUserLgpdSchema.safeParse({ reason, confirmationText, adminPassword });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Dados inválidos.");
        return;
      }
      payload = parsed.data;
    } else {
      const parsed = sensitiveReasonSchema.safeParse({ reason });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Motivo obrigatório.");
        return;
      }
      payload = parsed.data;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao executar ação.");
        return;
      }
      onSuccess(data.message ?? "Ação concluída com sucesso.");
    } catch {
      setError("Falha de conexão ao executar ação.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="modal-title" className="font-semibold text-lg text-[var(--text)]">
              {ACTION_TITLES[action]}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">Estudante: {userName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl hover:bg-[var(--primary-subtle)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <FeedbackBanner type="error" message={error} onClose={() => setError(null)} />}

        {action === "grant_premium" && hasActiveCakto && caktoWarning && (
          <FeedbackBanner type="warning" message={caktoWarning} />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {action === "grant_premium" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">Duração do Premium</label>
              <select
                value={durationType}
                onChange={(e) => setDurationType(e.target.value as typeof durationType)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-base"
              >
                <option value="7">7 dias</option>
                <option value="30">30 dias</option>
                <option value="90">90 dias</option>
                <option value="365">365 dias</option>
                <option value="custom">Data personalizada</option>
                <option value="lifetime">Vitalício</option>
              </select>

              {durationType === "custom" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Data de expiração</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-base"
                    required
                  />
                </div>
              )}

              {hasActiveCakto && (
                <label className="flex items-start gap-2.5 text-sm cursor-pointer p-3 rounded-xl border border-[var(--warn-border)] bg-[var(--warn-bg)] text-[var(--warn-text)]">
                  <input
                    type="checkbox"
                    checked={confirmCakto}
                    onChange={(e) => setConfirmCakto(e.target.checked)}
                    className="mt-1 w-4 h-4 shrink-0"
                  />
                  <span>
                    Estou ciente de que a assinatura Cakto continua ativa e continuará cobrando o estudante.
                  </span>
                </label>
              )}
            </div>
          )}

          {action === "extend_premium" && (
            <div>
              <label className="block text-sm font-medium mb-1">Adicionar dias ao plano</label>
              <select
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value as typeof extendDays)}
                className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-base"
              >
                <option value="7">+7 dias</option>
                <option value="30">+30 dias</option>
                <option value="90">+90 dias</option>
                <option value="365">+365 dias</option>
              </select>
            </div>
          )}

          <div>
            <label htmlFor="action-reason" className="block text-sm font-medium mb-1">
              Motivo obrigatório (registrado na auditoria)
            </label>
            <textarea
              id="action-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo administrativo desta ação..."
              className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-base"
              required
            />
          </div>

          {action === "delete_lgpd" && (
            <div className="space-y-3 p-3 rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] text-[var(--error-text)]">
              <p className="text-sm font-medium">
                Confirmação dupla (LGPD): esta ação é irreversível e excluirá permanentemente a conta e dados do estudante.
              </p>
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Confirmação textual:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder='Digite "EXCLUIR LGPD"'
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--error-border)] bg-[var(--surface)] text-[var(--text)] text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Sua senha de administrador (confirmação de segurança):
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Digite sua senha de login"
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--error-border)] bg-[var(--surface)] text-[var(--text)] text-base"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] text-sm font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`min-h-[44px] px-5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-50 ${
                action === "delete_lgpd" || action === "revoke_premium" || action === "suspend"
                  ? "bg-[#B42318] text-white hover:opacity-90"
                  : "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)]"
              }`}
            >
              {submitting ? "Processando..." : "Confirmar ação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
