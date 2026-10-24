export const themes=["light","dark","system"] as const;
export type Theme=typeof themes[number];
export const themePreferenceKey="meta:theme:v1";
export function parseTheme(value:unknown):Theme{return themes.includes(value as Theme)?value as Theme:"light";}
export function resolvedTheme(theme:Theme,prefersDark:boolean){return theme==="system"?(prefersDark?"dark":"light"):theme;}
export function applyThemePreference(theme:Theme){
 document.documentElement.dataset.theme=resolvedTheme(theme,window.matchMedia("(prefers-color-scheme: dark)").matches);
 try{localStorage.setItem(themePreferenceKey,theme);}catch{/* Apply even when storage is unavailable. */}
}
// Static code only; no user-provided text is interpolated into this script.
export const themeBootstrap=`try{var t=localStorage.getItem("meta:theme:v1");if(t!=="dark"&&t!=="system")t="light";document.documentElement.dataset.theme=t==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t}catch(e){document.documentElement.dataset.theme="light"}`;
