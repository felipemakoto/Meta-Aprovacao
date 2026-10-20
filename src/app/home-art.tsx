import type { ReactNode } from "react";

export function MetaMark() {
  return <svg width="38" height="38" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M3 4 20 19 37 4v32L20 21 3 36Z" fill="#329646" /><path d="m3 4 17 15v13L3 17ZM37 4 20 19v13l17-15Z" fill="#7CBC6D" /><path d="m20 19 8 7-8 7-8-7Z" fill="#D4E8BD" /></svg>;
}

type IconName = "book" | "math" | "science" | "history" | "geography" | "checklist" | "chart" | "calendar" | "pencil" | "target" | "timer" | "arrow";

export function HomeIcon({ name, size = 28, className }: { name: IconName; size?: number; className?: string }) {
  const shapes: Record<IconName, ReactNode> = {
    book: <><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Z" /><path d="M12 5v15M5 8h4M5 12h4M15 8h4M15 12h4" /></>,
    math: <><path d="M3 3v18h18Z" /><path d="M7 12v5h5M7 6v2M7 19h2" /></>,
    science: <><path d="M9 3h6M10 3v7L4 20c-.3.6.1 1 1 1h14c.9 0 1.3-.4 1-1l-6-10V3M7 15h10" /><circle cx="11" cy="17" r="1" /></>,
    history: <><path d="m2 7 10-5 10 5ZM3 21h18M4 18h16M6 9v7M10 9v7M14 9v7M18 9v7" /></>,
    geography: <><circle cx="12" cy="10" r="8" /><ellipse cx="12" cy="10" rx="4" ry="8" /><path d="M4 10h16M12 18v4M7 22h10M3 5c-3 7 1 14 9 14" /></>,
    checklist: <><rect x="3" y="2" width="18" height="20" rx="2" fill="#FCFDFB" /><path d="M6 7h8M6 12h8M6 17h6" /><circle cx="18" cy="7" r="3" fill="#CDE7D2" /><path d="m16.7 7 1 1 1.7-2" /><circle cx="18" cy="15" r="3" fill="#F4DCDC" /><path d="m17 14 2 2m0-2-2 2" /></>,
    chart: <><path d="M2 22h20M3 9l7-3 6-2 5-3m-4 0h4v4" /><path d="M5 22v-8h4v8M12 22V9h4v13M19 22V7h3v15" fill="#BEDCC1" /></>,
    calendar: <><rect x="2" y="4" width="20" height="18" rx="2" fill="#FCFDFB" /><path d="M2 9h20M7 1v6M17 1v6" /><path d="M6 12h2v2H6Zm5 0h2v2h-2Zm5 0h2v2h-2ZM6 17h2v2H6Zm5 0h2v2h-2Zm5 0h2v2h-2Z" fill="#BEDCC1" stroke="none" /></>,
    pencil: <><path d="M14 3H5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M7 8h5M7 12h3M7 17h3" /><path d="m11 16 2-5 7-8a2 2 0 0 1 3 3l-7 8-5 2Z" fill="#BEDCC1" /><path d="m18 5 3 3" /></>,
    target: <><circle cx="11" cy="13" r="9" /><circle cx="11" cy="13" r="5" /><circle cx="11" cy="13" r="1" fill="#329646" /><path d="m11 13 8-8M18 2v4h4l-4 4-3-1-1-3Z" fill="#BEDCC1" /></>,
    timer: <><circle cx="12" cy="14" r="8" fill="#F0EDF8" /><path d="M9 2h6M12 2v4M18 6l2-2M12 14l3-4M12 7v1M5 14h1M18 14h1M12 20v1" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  };
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[name]}</svg>;
}
