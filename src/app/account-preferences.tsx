"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {applyPreferences,restoreReadingPreferences,clearPreferences,preferenceKey} from "@/lib/account/settings-device";
import {applyThemePreference} from "@/lib/account/theme";
import {applyMotionPreference} from "@/lib/account/preferences";
import {parseAccountProfile} from "@/lib/account/contract";
export default function AccountPreferences(){const path=usePathname();useEffect(()=>{restoreReadingPreferences();const storage=(e:StorageEvent)=>{if(e.key===preferenceKey){restoreReadingPreferences();}};window.addEventListener("storage",storage);return()=>window.removeEventListener("storage",storage);},[]);
 useEffect(()=>{if(path==="/login"||path.startsWith("/configuracoes"))return;if(!/^\/(login|dashboard|questoes|simulados|premium|historico|estatisticas|configuracoes)(\/|$)/.test(path))return;const controller=new AbortController();fetch('/api/account/settings?view=preferences',{cache:'no-store',signal:controller.signal}).then(async r=>{if(r.status===401){clearPreferences();return;}if(r.ok){const data=await r.json();const {parsePreferences}=await import('@/lib/account/settings-contract');applyPreferences(parsePreferences(data.preferences));}}).catch(()=>{});if(path!=='/login')fetch('/api/account/profile',{cache:'no-store',signal:controller.signal}).then(async r=>{if(r.ok){const p=parseAccountProfile(await r.json());applyThemePreference(p.theme);applyMotionPreference(p.reduceMotion);}}).catch(()=>{});return()=>controller.abort();},[path]);return null;}
