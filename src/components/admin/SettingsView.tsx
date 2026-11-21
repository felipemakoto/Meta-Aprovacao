"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDateTimeBR } from "@/lib/admin/format";
import { can } from "@/lib/admin/rbac";
import { updateSettingsSchema } from "@/lib/admin/schemas";
import type { AdminRole, PlatformSettings } from "@/lib/admin/types";
import { ErrorState, FeedbackBanner, TableSkeleton } from "./FeedbackBanner";

export function SettingsView({ actorRole }: { actorRole: AdminRole }) {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmMaintenanceOpen, setConfirmMaintenanceOpen] = useState(false);

  const canEdit = can(actorRole, "settings:manage_prices");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/settings");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao carregar configurações.");
      setSettings(json as PlatformSettings);
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
        const res = await fetch("/api/admin/settings");
        const json = await res.json();
        if (!ignore) {
          if (!res.ok) throw new Error(json.error ?? "Erro ao carregar configurações.");
          setSettings(json as PlatformSettings);
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

  async function handleSave(nextSettings: PlatformSettings) {
    setFeedback(null);
    const parsed = updateSettingsSchema.safeParse(nextSettings);
    if (!parsed.success) {
      setFeedback({ type: "error", text: parsed.error.issues[0]?.message ?? "Dados inválidos." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar.");
      setSettings(json.settings as PlatformSettings);
      setFeedback({ type: "success", text: json.message ?? "Configurações atualizadas." });
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof Error ? err.message : "Erro ao salvar." });
    } finally {
      setSaving(false);
    }
  }

  function handleMaintenanceToggle() {
    if (!settings || !canEdit) return;
    if (!settings.modoManutencao) {
      setConfirmMaintenanceOpen(true);
    } else {
      setSettings({ ...settings, modoManutencao: false });
    }
  }

  if (loading) return <TableSkeleton rows={6} />;
  if (error || !settings) return <ErrorState message={error ?? "Erro ao carregar."} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif-display text-[32px] md:text-[36px] leading-tight">
          Configurações
        </h1>
        <p className="text-[var(--text-secondary)] text-base mt-1">
          Preços dos planos, feature flags e modo de manutenção. Última alteração por{" "}
          {settings.atualizadoPor} em {formatDateTimeBR(settings.atualizadoEm)}.
        </p>
      </div>

      {!canEdit && (
        <FeedbackBanner
          type="warning"
          message="Seu papel permite apenas visualização das configurações. Alterações são restritas ao Super Admin."
        />
      )}

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.text}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Preços e planos */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-lg">Preços e planos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {settings.planos.map((plano, idx) => (
            <div
              key={plano.id}
              className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] space-y-3"
            >
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Nome do plano
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={plano.nome}
                  onChange={(e) => {
                    const next = [...settings.planos];
                    next[idx] = { ...plano, nome: e.target.value };
                    setSettings({ ...settings, planos: next });
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-base disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={!canEdit}
                  value={(plano.valorCentavos / 100).toFixed(2)}
                  onChange={(e) => {
                    const reais = Number.parseFloat(e.target.value || "0");
                    const centavos = Math.max(0, Math.round(reais * 100));
                    const next = [...settings.planos];
                    next[idx] = { ...plano, valorCentavos: centavos };
                    setSettings({ ...settings, planos: next });
                  }}
                  className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-base disabled:opacity-60"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Flags */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-lg">Feature flags</h2>
        <div className="divide-y divide-[var(--border)]">
          {settings.featureFlags.map((flag, idx) => (
            <div
              key={flag.chave}
              className="py-3.5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-medium text-base">{flag.nome}</p>
                <p className="text-sm text-[var(--text-secondary)]">{flag.descricao}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={flag.ativo}
                aria-label={flag.nome}
                disabled={!canEdit}
                onClick={() => {
                  const next = [...settings.featureFlags];
                  next[idx] = { ...flag, ativo: !flag.ativo };
                  setSettings({ ...settings, featureFlags: next });
                }}
                className={`min-h-[44px] min-w-[64px] px-2 rounded-full border transition-colors flex items-center cursor-pointer disabled:opacity-50 ${
                  flag.ativo
                    ? "bg-[var(--primary)] border-[var(--primary)] justify-end"
                    : "bg-[var(--bg)] border-[var(--border)] justify-start"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-white border border-[var(--border)]" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modo de manutenção */}
      <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-lg">Modo de manutenção</h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Bloqueia o acesso dos estudantes ao site principal exibindo um aviso programado.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.modoManutencao}
            aria-label="Ativar ou desativar modo de manutenção"
            disabled={!canEdit}
            onClick={handleMaintenanceToggle}
            className={`min-h-[44px] min-w-[64px] px-2 rounded-full border transition-colors flex items-center cursor-pointer disabled:opacity-50 ${
              settings.modoManutencao
                ? "bg-[#B42318] border-[#B42318] justify-end"
                : "bg-[var(--bg)] border-[var(--border)] justify-start"
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white border border-[var(--border)]" />
          </button>
        </div>

        <div>
          <label htmlFor="maint-msg" className="block text-xs text-[var(--text-secondary)] mb-1">
            Mensagem pública de manutenção
          </label>
          <input
            id="maint-msg"
            type="text"
            disabled={!canEdit}
            value={settings.mensagemManutencao}
            onChange={(e) =>
              setSettings({ ...settings, mensagemManutencao: e.target.value })
            }
            className="w-full min-h-[44px] px-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-base disabled:opacity-60"
          />
        </div>
      </section>

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(settings)}
            className="min-h-[48px] px-6 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] font-semibold text-base cursor-pointer disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </div>
      )}

      {confirmMaintenanceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4"
          >
            <h3 className="font-semibold text-lg">Confirmar modo de manutenção</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Ao ativar o modo de manutenção e salvar, todos os estudantes verão a tela de manutenção até que seja desativado.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmMaintenanceOpen(false)}
                className="min-h-[44px] px-4 rounded-xl border border-[var(--border)] text-sm font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSettings({ ...settings, modoManutencao: true });
                  setConfirmMaintenanceOpen(false);
                }}
                className="min-h-[44px] px-4 rounded-xl bg-[#B42318] text-white text-sm font-semibold cursor-pointer"
              >
                Ativar manutenção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
