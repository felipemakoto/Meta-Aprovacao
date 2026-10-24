export const preferenceDefaults={institution:"both",course:"",school:"",examDate:"",dailyGoal:10,weekdays:[1,2,3,4,5],minutes:30,priorities:[] as string[],difficulty:"all",explanations:"expanded",fontSize:"normal",contrast:"normal",density:"comfortable",dashboard:"overview",customCount:20,customMinutes:60,notifyStudy:true,notifyReview:true,quietStart:"",quietEnd:""};
export type Preferences=typeof preferenceDefaults;
export const premiumPreferenceKeys=["customCount","customMinutes","notifyStudy","notifyReview","quietStart","quietEnd"] as const;
export function changesPremiumPreferences(current:Preferences,next:Preferences){return premiumPreferenceKeys.some(key=>current[key]!==next[key]);}
const subjects=["matematica","portugues","ciencias","historia","geografia"];
export function parsePreferences(value:unknown):Preferences{
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("invalid_input");const p=value as Preferences;
 if(Object.keys(p).sort().join()!==Object.keys(preferenceDefaults).sort().join())throw Error("invalid_input");
 for(const [key,allowed] of Object.entries({institution:["etec","if","both"],difficulty:["all","easy","medium","hard"],explanations:["expanded","on_demand"],fontSize:["normal","large"],contrast:["normal","high"],density:["comfortable","compact"],dashboard:["overview","goals"]}))if(!allowed.includes(p[key as keyof Preferences] as string))throw Error("invalid_input");
 for(const key of ["course","school"] as const)if(typeof p[key]!=="string"||p[key].length>100||/[\x00-\x1f\x7f]/.test(p[key]))throw Error("invalid_input");
 if(typeof p.examDate!=="string"||(p.examDate!==""&&(!/^20\d\d-\d\d-\d\d$/.test(p.examDate)||(!Number.isFinite(Date.parse(p.examDate+"T12:00:00Z"))||new Date(p.examDate+"T12:00:00Z").toISOString().slice(0,10)!==p.examDate))))throw Error("invalid_input");
 for(const [key,min,max] of [["dailyGoal",1,100],["minutes",15,240],["customCount",5,100],["customMinutes",10,240]] as const)if(!Number.isInteger(p[key])||p[key]<min||p[key]>max)throw Error("invalid_input");
 if(!Array.isArray(p.weekdays)||p.weekdays.length<1||p.weekdays.length>7||new Set(p.weekdays).size!==p.weekdays.length||p.weekdays.some(n=>!Number.isInteger(n)||n<0||n>6))throw Error("invalid_input");
 if(!Array.isArray(p.priorities)||p.priorities.length>5||new Set(p.priorities).size!==p.priorities.length||p.priorities.some(s=>!subjects.includes(s)))throw Error("invalid_input");
 if(typeof p.notifyStudy!=="boolean"||typeof p.notifyReview!=="boolean")throw Error("invalid_input");
 const clock=/^([01][0-9]|2[0-3]):[0-5][0-9]$/;
 if(typeof p.quietStart!=="string"||typeof p.quietEnd!=="string"||((p.quietStart!==""||p.quietEnd!=="")&&(!clock.test(p.quietStart)||!clock.test(p.quietEnd)||p.quietStart===p.quietEnd)))throw Error("invalid_input");
 return {...p,course:p.course.trim(),school:p.school.trim()};
}
export function daysToExam(date:string,now=new Date()) {if(!date)return null;const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);return Math.round((Date.parse(date+"T12:00:00Z")-Date.parse(today+"T12:00:00Z"))/86400000);}
