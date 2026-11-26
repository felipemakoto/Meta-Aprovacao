"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./analytics.module.css";

const dismissalKey = "meta:acknowledged-site-announcement";

export default function SiteAnnouncement() {
  const path = usePathname();
  const isAdmin = path === "/admin" || path.startsWith("/admin/");
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) return;
    let activeRequest: AbortController | undefined;
    async function refresh() {
      if (document.hidden || activeRequest) return;
      const controller = new AbortController();
      activeRequest = controller;
      try {
        const response = await fetch("/api/site-status", { cache: "no-store", signal: controller.signal });
        if (!response.ok) return;
        const status = await response.json();
        if (controller.signal.aborted) return;
        try {
          const saved = localStorage.getItem(dismissalKey);
          if (saved !== null) setAcknowledged(saved);
        } catch {
          // Dismissal still works for the current tab when storage is blocked.
        }
        setAnnouncement(status.announcement);
      } catch {
        // Keep the last displayed announcement during a temporary network failure.
      } finally {
        activeRequest = undefined;
      }
    }
    void refresh();
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      activeRequest?.abort();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [isAdmin]);

  if (isAdmin || !announcement || announcement === acknowledged) return null;

  function acknowledge() {
    setAcknowledged(announcement);
    if (announcement === null) return;
    try { localStorage.setItem(dismissalKey, announcement); } catch { /* Storage is optional. */ }
  }

  return (
    <aside aria-labelledby="site-announcement-title" className={`${styles.notice} ${styles.announcement}`}>
      <div>
        <h2 id="site-announcement-title">Aviso do site</h2>
        <p role="status">{announcement}</p>
      </div>
      <div className={styles.actions}>
        <button type="button" onClick={acknowledge}>Entendi</button>
      </div>
    </aside>
  );
}
