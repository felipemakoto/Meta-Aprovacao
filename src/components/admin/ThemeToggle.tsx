"use client";

import { Moon, Sun } from "lucide-react";
import { useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  function toggle() {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("meta-admin-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("meta-admin-theme", "light");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--primary-subtle)] transition-colors cursor-pointer"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
