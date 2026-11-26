"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { SiteStatus, SiteStatusUpdate } from "@/lib/site-status/server";

type Settings = SiteStatus & { canManage: boolean };
type Feedback = { text: string; error?: boolean };
const card = "space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5";
const button = "min-h-[44px] rounded-xl px-4 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50";
const primary = button + " bg-[var(--primary)] text-[var(--primary-text)]";
const secondary = button + " border border-[var(--border)] text-[var(--text)]";

export function SiteStatusSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft, setDraft] = useState("");
  const [maintenanceDraft, setMaintenanceDraft] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/admin/site-status", { cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error();
        const current: Settings = await response.json();
        if (controller.signal.aborted) return;
        setSettings(current);
        setDraft(current.announcement ?? "");
        setMaintenanceDraft(current.maintenance_message ?? "");
      } catch {
        if (!controller.signal.aborted) setFeedback({ text: "Não foi possível carregar os controles do site.", error: true });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt]);

  async function save(change: SiteStatusUpdate, success: string) {
    setSaving(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/site-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });
      if (!response.ok) throw new Error();
      const current: SiteStatus = await response.json();
      setSettings(previous => previous ? { ...previous, ...current } : previous);
      if ("announcement" in change) setDraft(current.announcement ?? "");
      if ("maintenance_message" in change) setMaintenanceDraft(current.maintenance_message ?? "");
      setFeedback({ text: success });
    } catch {
      setFeedback({ text: "Não foi possível salvar. Tente novamente.", error: true });
    } finally {
      setSaving(false);
    }
  }

  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const announcement = draft.trim();
    if (announcement) void save({ announcement }, "Aviso publicado.");
  }

  if (!settings) {
    return (
      <section className={card} aria-label="Controles do site">
        {feedback ? (
          <>
            <p role="alert" className="text-[var(--error-text)]">{feedback.text}</p>
            <button type="button" className={secondary} onClick={() => { setFeedback(null); setAttempt(value => value + 1); }}>
              Tentar novamente
            </button>
          </>
        ) : <p role="status">Carregando controles do site…</p>}
      </section>
    );
  }

  const canManage = settings.canManage;
  return (
    <div className="space-y-6">
      <section className={card} aria-labelledby="site-announcement-heading">
        <div>
          <h2 id="site-announcement-heading" className="font-semibold">Aviso no site</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">O aviso aparece na parte inferior da página para todos os visitantes.</p>
        </div>
        <p className="text-sm [overflow-wrap:anywhere]">
          <strong>Aviso atual</strong> {settings.announcement ?? "Nenhum aviso publicado."}
        </p>
        {canManage && (
          <form onSubmit={publish} className="space-y-3">
            <label htmlFor="site-announcement" className="block text-sm font-medium">Mensagem</label>
            <textarea id="site-announcement" value={draft} rows={3} maxLength={300} disabled={saving}
              onChange={event => setDraft(event.target.value)}
              className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-base text-[var(--text)]" />
            <div className="flex flex-wrap gap-2">
              <button className={primary} disabled={saving || !draft.trim() || draft.trim() === settings.announcement}>Publicar aviso</button>
              {settings.announcement && (
                <button type="button" className={secondary} disabled={saving}
                  onClick={() => void save({ announcement: null }, "Aviso removido.")}>
                  Remover aviso
                </button>
              )}
            </div>
          </form>
        )}
      </section>

      <section className={card} aria-labelledby="site-maintenance-heading">
        <div>
          <h2 id="site-maintenance-heading" className="font-semibold">Modo de manutenção</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Mostra uma página de manutenção aos visitantes e mantém o painel administrativo acessível.
          </p>
        </div>
        <p className="text-sm"><strong>Status do site</strong> {settings.maintenance ? "Em manutenção" : "Aberto"}</p>
        {canManage ? (
          <form className="space-y-3" onSubmit={event => {
            event.preventDefault();
            const maintenance_message = maintenanceDraft.trim() || null;
            void save({ maintenance_message }, maintenance_message ? "Mensagem de manutenção salva." : "Mensagem de manutenção removida.");
          }}>
            <label htmlFor="maintenance-message" className="block text-sm font-medium">Mensagem da manutenção</label>
            <p id="maintenance-message-help" className="text-sm text-[var(--text-secondary)]">
              Opcional. Se ficar em branco, os visitantes verão apenas o texto padrão.
            </p>
            <textarea id="maintenance-message" aria-describedby="maintenance-message-help" value={maintenanceDraft}
              onChange={event => setMaintenanceDraft(event.target.value)} rows={3} maxLength={300} disabled={saving}
              className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-base text-[var(--text)]" />
            <button className={secondary} disabled={saving || (maintenanceDraft.trim() || null) === (settings.maintenance_message ?? null)}>
              Salvar mensagem
            </button>
          </form>
        ) : settings.maintenance_message && (
          <p className="whitespace-pre-wrap text-sm [overflow-wrap:anywhere]">{settings.maintenance_message}</p>
        )}
        {canManage && (
          <button type="button" className={settings.maintenance ? primary : secondary} disabled={saving}
            onClick={() => {
              const maintenance = !settings.maintenance;
              if (maintenance && !window.confirm("Ativar a manutenção e fechar o site para visitantes?")) return;
              void save({ maintenance }, maintenance ? "Manutenção ativada." : "Site reaberto.");
            }}>
            {settings.maintenance ? "Reabrir site" : "Ativar manutenção"}
          </button>
        )}
      </section>

      {saving && <p role="status" className="text-sm">Salvando…</p>}
      {feedback && <p role={feedback.error ? "alert" : "status"} className={feedback.error ? "text-sm text-[var(--error-text)]" : "text-sm"}>{feedback.text}</p>}
    </div>
  );
}
