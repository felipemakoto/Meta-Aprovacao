"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePwa } from "./provider";
import styles from "./pill-nav.module.css";

type NavItem = {
  key: "dashboard" | "questions" | "simulations" | "history" | "statistics" | "account";
  href: string;
  label: string;
  ariaLabel: string;
};

const ITEMS: NavItem[] = [
  { key: "dashboard", href: "/dashboard", label: "Estudos", ariaLabel: "Meus estudos" },
  { key: "questions", href: "/questoes", label: "Questões", ariaLabel: "Questões" },
  { key: "simulations", href: "/simulados", label: "Simulados", ariaLabel: "Simulados" },
  { key: "history", href: "/historico", label: "Histórico", ariaLabel: "Histórico" },
  { key: "statistics", href: "/estatisticas", label: "Dados", ariaLabel: "Estatísticas" },
  { key: "account", href: "/login", label: "Conta", ariaLabel: "Minha conta" },
];

function NavIcon({ name }: { name: NavItem["key"] }) {
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
      {name === "history" && (
        <>
          <path d="M3 11a9 9 0 1 1 2 7M3 5v6h6" />
          <path d="M12 7v6l4 2" />
        </>
      )}
      {name === "statistics" && <path d="M4 20V4m0 16h17M8 16v-5m5 5V7m5 9V3" />}
      {name === "account" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </>
      )}
    </svg>
  );
}

export default function PwaPillNav({
  active,
  preview = false,
  hidden = false,
}: {
  active?: string;
  preview?: boolean;
  hidden?: boolean;
}) {
  const { standalone } = usePwa();
  const pathname = usePathname();

  if (standalone !== true || hidden) return null;

  function isCurrent(item: NavItem) {
    if (active === item.key) return true;
    if (item.key === "account" && (pathname?.startsWith("/configuracoes") || pathname?.startsWith("/login"))) {
      return true;
    }
    return pathname === item.href || pathname?.startsWith(`${item.href}/`);
  }

  return (
    <div className={styles.dock}>
      <nav className={styles.pill} aria-label="Navegação do aplicativo">
        {ITEMS.map((item) => {
          const href = preview && item.key !== "account" ? `${item.href}/preview` : item.href;
          const current = isCurrent(item);
          return (
            <Link
              key={item.key}
              href={href}
              className={styles.item}
              aria-label={item.ariaLabel}
              aria-current={current ? "page" : undefined}
            >
              <NavIcon name={item.key} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
