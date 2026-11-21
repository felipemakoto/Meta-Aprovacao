"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FeedbackBanner } from "@/components/admin/FeedbackBanner";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import { loginSchema } from "@/lib/admin/schemas";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Preencha os campos corretamente.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Falha de conexão ao tentar autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg)] text-[var(--text)] p-4 md:p-6">
      <div className="flex justify-end">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-md mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-[#EBF2EE] dark:bg-[#1D3127] border border-[var(--border)] flex items-center justify-center p-2 shrink-0">
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full text-[var(--primary)]">
              <path d="M10 49V20l20 17 24-26v38" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-base text-[var(--text)]">Meta Aprovação</p>
            <p className="text-xs text-[var(--text-secondary)]">Acesso restrito à equipe</p>
          </div>
        </div>

        <h1 className="font-serif-display text-[32px] leading-tight mb-2">
          Painel Interno
        </h1>
        <p className="text-[var(--text-secondary)] text-base mb-6">
          Entre com suas credenciais administrativas para continuar.
        </p>

        {error && (
          <div className="mb-5">
            <FeedbackBanner type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              E-mail administrativo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@metaaprovacao.com.br"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-base"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-base"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] font-semibold text-base transition-colors cursor-pointer disabled:opacity-60"
          >
            {loading ? "Verificando..." : "Entrar no painel"}
          </button>
        </form>

        <p className="mt-6 text-xs text-[var(--text-secondary)] leading-relaxed">
          Protegido contra tentativas repetidas: após 5 erros consecutivos, o acesso é bloqueado temporariamente.
        </p>
      </main>

      <footer className="text-center text-xs text-[var(--text-secondary)] py-3">
        Meta Aprovação · Painel Administrativo Seguro
      </footer>
    </div>
  );
}
