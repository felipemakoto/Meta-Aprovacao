"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {applyMotionPreference,motionPreferenceEvent,motionPreferenceKey} from "@/lib/account/preferences";

export default function PageMotion() {
  const pathname = usePathname();

  useEffect(()=>{
    try{if(localStorage.getItem(motionPreferenceKey)==="true")applyMotionPreference(true);}catch{/* Optional device preference. */}
    const sync=(event:StorageEvent)=>{if(event.key===motionPreferenceKey&&event.newValue!==null)applyMotionPreference(event.newValue==="true");};
    window.addEventListener("storage",sync);
    return()=>window.removeEventListener("storage",sync);
  },[]);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preference.matches || document.documentElement.dataset.reduceMotion==="true" || typeof Element.prototype.animate !== "function") return;

    let entrance: Animation | undefined;
    const frame = requestAnimationFrame(() => {
      const content = document.querySelector("main");
      if (!content || preference.matches || document.documentElement.dataset.reduceMotion==="true") return;
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
      if (preference.matches || document.documentElement.dataset.reduceMotion==="true") {
        cancelAnimationFrame(frame);
        entrance?.cancel();
      }
    };
    preference.addEventListener("change", stop);
    window.addEventListener(motionPreferenceEvent,stop);
    return () => {
      cancelAnimationFrame(frame);
      entrance?.cancel();
      preference.removeEventListener("change", stop);
      window.removeEventListener(motionPreferenceEvent,stop);
    };
  }, [pathname]);

  return null;
}
