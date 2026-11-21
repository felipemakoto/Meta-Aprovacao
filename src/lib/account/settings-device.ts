export {preferenceDefaults,parsePreferences,type Preferences} from "./settings-contract";
import {parsePreferences,type Preferences} from "./settings-contract";
export const preferenceKey="meta:preferences:v1",preferenceEvent="meta:preferences";
let memory:Preferences|null=null;
function reading(p:Pick<Preferences,'fontSize'|'contrast'|'density'>){document.documentElement.dataset.fontSize=p.fontSize;document.documentElement.dataset.contrast=p.contrast;document.documentElement.dataset.density=p.density;}
export function applyPreferences(p:Preferences){memory=parsePreferences(p);const visual={fontSize:p.fontSize,contrast:p.contrast,density:p.density};reading(visual);try{localStorage.setItem(preferenceKey,JSON.stringify(visual));}catch{}window.dispatchEvent(new Event(preferenceEvent));}
export function devicePreferences(){return memory;}
export function restoreReadingPreferences(){try{const p=JSON.parse(localStorage.getItem(preferenceKey)??'null');if(p&&['normal','large'].includes(p.fontSize)&&['normal','high'].includes(p.contrast)&&['comfortable','compact'].includes(p.density))reading(p);}catch{}}
export function clearPreferences(){memory=null;try{localStorage.removeItem(preferenceKey);}catch{}reading({fontSize:'normal',contrast:'normal',density:'comfortable'});window.dispatchEvent(new Event(preferenceEvent));}
