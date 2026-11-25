"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePwa } from "./provider";
import styles from "./pill-nav.module.css";

type IconName =
  | "dashboard"
  | "questions"
  | "simulations"
  | "more"
  | "history"
  | "statistics"
  | "premium"
  | "account"
  | "settings"
  | "admin";

type NavItem = {
  key: string;
  href: string;
  label: string;
  ariaLabel?: string;
  icon: IconName;
  previewable?: boolean;
};

const PRIMARY_ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Estudos", ariaLabel: "Meus estudos", icon: "dashboard", previewable: true },
  { key: "questions", href: "/questoes", label: "Questões", icon: "questions", previewable: true },
  { key: "simulations", href: "/simulados", label: "Simulados", icon: "simulations", previewable: true },
];

const MORE_ITEMS: NavItem[] = [
  { key: "history", href: "/historico", label: "Histórico", icon: "history", previewable: true },
  { key: "statistics", href: "/estatisticas", label: "Estatísticas", icon: "statistics", previewable: true },
  { key: "premium", href: "/premium/estudos", label: "Estudos · Premium", icon: "premium" },
  { key: "account", href: "/login", label: "Minha conta", icon: "account" },
  { key: "settings", href: "/configuracoes", label: "Configurações", icon: "settings" },
];

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "dashboard" && (
        <>
          <path d="m3 10 9-7 9 7v10H3Z" />
          <path d="M9 20v-7h6v7" />
        </>
      )}
      {name === "questions" && (
        <>
          <path d="M12 5C8 3 5 3 2 4v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-6-1-10 1ZM12 5v16" />
          <path d="M5 8h4m6 0h4" />
        </>
      )}
      {name === "simulations" && (
        <>
          <circle cx="12" cy="14" r="8" />
          <path d="M9 2h6m-3 0v4m6 0 2-2m-8 6v5l3 2" />
        </>
      )}
      {name === "more" && (
        <>
          <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </>
      )}
      {name === "history" && (
        <>
          <path d="M3 11a9 9 0 1 1 2 7M3 5v6h6" />
          <path d="M12 7v6l4 2" />
        </>
      )}
      {name === "statistics" && <path d="M4 20V4m0 16h17M8 16v-5m5 5V7m5 9V3" />}
      {name === "premium" && <path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />}
      {name === "account" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </>
      )}
      {name === "settings" && (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
        </>
      )}
      {name === "admin" && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />}
    </svg>
  );
}

export default function PwaPillNav() {
  const { standalone, isAdmin } = usePwa();
  const pathname = usePathname();
  const [menu, setMenu] = useState({ pathname, open: false });
  if (menu.pathname !== pathname) setMenu({ pathname, open: false });
  const moreOpen = menu.pathname === pathname && menu.open;
  const [isExamMode, setIsExamMode] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkExam = () => {
      setIsExamMode(Boolean(document.querySelector('[data-study-exam="true"]')));
    };
    const frame = requestAnimationFrame(checkExam);
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setMenu({ pathname, open: false });
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenu({ pathname, open: false });
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen, pathname]);

  if (standalone !== true || pathname?.startsWith("/admin") || isExamMode) return null;

  const preview = pathname?.endsWith("/preview") ?? false;

  function isCurrent(item: NavItem) {
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  }

  const moreItems: NavItem[] = isAdmin
    ? [...MORE_ITEMS, { key: "admin", href: "/admin", label: "Painel Admin", icon: "admin" }]
    : MORE_ITEMS;

  const moreActive = moreItems.some((item) => isCurrent(item));

  return (
    <div ref={dockRef} className={styles.dock}>
      {moreOpen && (
        <div className={styles.menu} role="menu" aria-label="Mais seções">
          {moreItems.map((item) => {
            const href = preview && item.previewable ? `${item.href}/preview` : item.href;
            const current = isCurrent(item);
            return (
              <Link
                key={item.key}
                href={href}
                role="menuitem"
                className={styles.menuItem}
                aria-current={current ? "page" : undefined}
                onClick={() => setMenu({ pathname, open: false })}
              >
                <NavIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      <nav className={styles.pill} aria-label="Navegação do aplicativo">
        {PRIMARY_ITEMS.map((item) => {
          const href = preview && item.previewable ? `${item.href}/preview` : item.href;
          const current = isCurrent(item);
          return (
            <Link
              key={item.key}
              href={href}
              className={styles.item}
              aria-label={item.ariaLabel ?? item.label}
              aria-current={current ? "page" : undefined}
            >
              <NavIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={styles.item}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          aria-label="Mais opções"
          data-active={moreOpen || moreActive ? "true" : undefined}
          onClick={() => setMenu({ pathname, open: !moreOpen })}
        >
          <NavIcon name="more" />
          <span>Mais</span>
        </button>
      </nav>
    </div>
  );
}
