"use client";
import {useEffect} from "react";
import {applyThemePreference,parseTheme,themePreferenceKey} from "@/lib/account/theme";
export default function SiteTheme(){
 useEffect(()=>{
  const media=window.matchMedia("(prefers-color-scheme: dark)");
  const update=()=>{try{applyThemePreference(parseTheme(localStorage.getItem(themePreferenceKey)));}catch{applyThemePreference("light");}};
  const storage=(event:StorageEvent)=>{if(event.key===themePreferenceKey||event.key===null)update();};
  update();media.addEventListener("change",update);window.addEventListener("storage",storage);
  return()=>{media.removeEventListener("change",update);window.removeEventListener("storage",storage);};
 },[]);
 return null;
}
