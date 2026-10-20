"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || typeof Element.prototype.animate !== "function") return;

    let entrance: Animation | undefined;
    const frame = requestAnimationFrame(() => {
      const content = document.querySelector("main");
      if (!content || preference.matches) return;
      const tokens = getComputedStyle(document.documentElement);
      entrance = content.animate([
        { opacity: .88, transform: `translateY(${tokens.getPropertyValue("--motion-distance").trim() || "8px"})` },
        { opacity: 1, transform: "none" },
      ], {
        id: "meta-page-enter",
        duration: Number.parseFloat(tokens.getPropertyValue("--motion-page")) || 360,
        easing: tokens.getPropertyValue("--motion-ease").trim() || "ease-out",
      });
    });
    const stop = () => {
      if (preference.matches) {
        cancelAnimationFrame(frame);
        entrance?.cancel();
      }
    };
    preference.addEventListener("change", stop);
    return () => {
      cancelAnimationFrame(frame);
      entrance?.cancel();
      preference.removeEventListener("change", stop);
    };
  }, [pathname]);

  return null;
}
