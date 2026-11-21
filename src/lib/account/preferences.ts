export const motionPreferenceEvent="meta:motion-preference";
export const motionPreferenceKey="meta:reduce-motion:v1";
export function applyMotionPreference(reduce:boolean){
 document.documentElement.dataset.reduceMotion=String(reduce);
 try{localStorage.setItem(motionPreferenceKey,String(reduce));}catch{/* Preference still applies without storage. */}
 window.dispatchEvent(new Event(motionPreferenceEvent));
}
