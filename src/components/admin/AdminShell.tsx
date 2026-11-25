"use client";

import { ArrowLeft, LogOut, Menu, PanelLeftClose, PanelLeftOpen, User, X, Check } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { can, ROLE_LABELS, type PermissionAction } from "@/lib/admin/rbac";
import type { SessionPayload } from "@/lib/admin/types";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  requiredAction: PermissionAction;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Visão geral", requiredAction: "dashboard:view" },
  { href: "/admin/usuarios", label: "Usuários", requiredAction: "users:view" },
  { href: "/admin/assinaturas", label: "Assinaturas", requiredAction: "subscriptions:view" },
  { href: "/admin/admins", label: "Administradores", requiredAction: "admins:view" },
  { href: "/admin/auditoria", label: "Auditoria", requiredAction: "audit:view" },
  { href: "/admin/configuracoes", label: "Configurações", requiredAction: "settings:view" },
];

export function AdminShell({
  session,
  children,
}: {
  session: SessionPayload;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabletCollapsed, setTabletCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  // Edição de Nome do Admin
  const [currentName, setCurrentName] = useState(session.nome);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(session.nome);
  const [savingName, setSavingName] = useState(false);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!editNameValue.trim() || editNameValue.trim() === currentName) {
      setIsEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editNameValue.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCurrentName(data.name);
        setIsEditingName(false);
        router.refresh();
      } else {
        alert(data.error ?? "Erro ao atualizar nome.");
      }
    } catch {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setSavingName(false);
    }
  }

  const visibleNav = NAV_ITEMS.filter((item) =>
    can(session.papel, item.requiredAction)
  );

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      const response = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("logout_failed");
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setLogoutError(true);
    } finally {
      setLoggingOut(false);
    }
  }

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div>
        <div className="flex items-center gap-3 px-2 py-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#EBF2EE] dark:bg-[#1D3127] border border-[var(--border)] flex items-center justify-center p-2 shrink-0">
            <svg viewBox="0 0 64 64" fill="none" className="w-full h-full text-[var(--primary)]">
              <path d="M10 49V20l20 17 24-26v38" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {!tabletCollapsed && (
            <div className="min-w-0">
              <p className="font-semibold text-base text-[var(--text)] truncate">
                Meta Aprovação
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                Painel Interno
              </p>
            </div>
          )}
        </div>

        <nav aria-label="Navegação do painel" className="space-y-1.5">
          {visibleNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`min-h-[44px] flex items-center px-3.5 rounded-xl text-sm md:text-base font-medium transition-colors ${
                  active
                    ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--primary-subtle)] hover:text-[var(--text)]"
                }`}
                title={item.label}
              >
                <span className={tabletCollapsed ? "lg:inline md:sr-only" : ""}>
                  {item.label}
                </span>
                {tabletCollapsed && (
                  <span className="hidden md:inline lg:hidden text-xs font-semibold">
                    {item.label.slice(0, 3)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-2 px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {tabletCollapsed ? "Live" : "Conectado ao Supabase"}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg)] text-[var(--text)]">
      <aside
        className={`hidden md:flex flex-col shrink-0 border-r border-[var(--border)] bg-[var(--surface)] transition-all ${
          tabletCollapsed ? "md:w-20 lg:w-64" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[var(--surface)] border-r border-[var(--border)] flex flex-col h-full">
            <div className="flex justify-end p-2">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[var(--text)] hover:bg-[var(--primary-subtle)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header className={`sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] px-4 md:px-6 py-3 flex items-center justify-between gap-3 ${isEditingName ? "flex-wrap sm:flex-nowrap" : ""}`}>
          <div className={`flex items-center gap-2 min-w-0 ${isEditingName ? "w-full sm:w-auto" : ""}`}>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
              className="md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text)] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setTabletCollapsed((v) => !v)}
              aria-label={tabletCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
              className="hidden md:inline-flex lg:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text)] cursor-pointer"
            >
              {tabletCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>

            <div className="min-w-0">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    disabled={savingName}
                    autoFocus
                    className="text-sm font-semibold px-2 py-1 rounded-lg border border-[var(--primary)] bg-[var(--surface)] text-[var(--text)] focus:outline-none min-w-0 w-36 sm:w-48"
                  />
                  <button
                    type="submit"
                    disabled={savingName}
                    title="Salvar nome"
                    className="p-1 rounded-md bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditNameValue(currentName);
                    }}
                    title="Cancelar"
                    className="p-1 rounded-md text-[var(--text-secondary)] hover:bg-[var(--primary-subtle)] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5 group">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">
                    {currentName}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    title="Editar meu nome"
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--primary)] opacity-70 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5"
                  >
                    <User className="w-3.5 h-3.5 inline ml-0.5" />
                  </button>
                </div>
              )}
              <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--primary-subtle)] text-[var(--primary)] mt-0.5">
                {ROLE_LABELS[session.papel]}
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Link
              href="/"
              aria-label="Voltar ao site"
              title="Voltar ao site"
              className="min-h-[44px] inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text)] text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Voltar ao site</span>
              <span className="sm:hidden">Site</span>
            </Link>
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              aria-label="Encerrar sessão administrativa"
              title="Encerrar sessão administrativa"
              className="min-h-[44px] px-3.5 inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--primary-subtle)] text-sm font-medium cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </header>

        {logoutError && (
          <p role="alert" className="px-4 md:px-6 py-3 border-b border-[var(--error-border)] bg-[var(--error-bg)] text-sm text-[var(--error-text)]">
            Não foi possível encerrar a sessão. Tente novamente.
          </p>
        )}

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="bg-black text-[#9aa89f] border-t border-neutral-900 px-4 md:px-6 py-4 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-white">Meta Aprovação · Painel Administrativo</span>
          </div>
          <span className="text-[#8e9f95]">
            Dados reais sincronizados em tempo real com o banco Supabase.
          </span>
        </footer>
      </div>
    </div>
  );
}
