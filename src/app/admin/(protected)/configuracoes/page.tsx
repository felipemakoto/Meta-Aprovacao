"use client";

import { useState } from "react";

export default function ConfiguracoesPage() {
  return <SettingsForm />;
}

function SettingsForm() {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setMessage("O nome deve ter pelo menos 2 caracteres.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = (await res.json()) as { ok?: boolean; name?: string; error?: string };
      if (res.ok && data.ok) {
        setMessage("✅ Nome atualizado com sucesso! A página vai recarregar.");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setMessage(data.error ?? "Erro ao atualizar nome.");
      }
    } catch {
      setMessage("Falha na conexão com o servidor.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Configurações</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Altere seu nome de exibição no painel administrativo.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="border border-[var(--border)] rounded-2xl p-5 bg-[var(--surface)] space-y-4"
      >
        <h2 className="font-medium text-[var(--text)]">Nome de exibição</h2>

        <div className="space-y-1">
          <label htmlFor="admin-name" className="text-sm text-[var(--text-secondary)]">
            Novo nome
          </label>
          <input
            id="admin-name"
            type="text"
            className="w-full border border-[var(--border)] rounded-xl px-3 py-2 text-sm bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            placeholder="Ex.: João Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
            minLength={2}
            maxLength={100}
          />
        </div>

        <button
          type="submit"
          disabled={saving || name.trim().length < 2}
          className="min-h-[44px] px-5 rounded-xl bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? "Salvando…" : "Salvar nome"}
        </button>

        {message && (
          <p className={`text-sm ${message.startsWith("✅") ? "text-green-700" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
