import type {Preferences} from './settings-contract';
export function inQuietHours(at:Date,start:string,end:string){if(!start||!end)return false;const time=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(at);return start<end?time>=start&&time<end:time>=start||time<end;}
export function sessionReminderAllowed(kind:string,at:Date,p:Preferences){return !inQuietHours(at,p.quietStart,p.quietEnd)&&(['review','flashcards'].includes(kind)?p.notifyReview:p.notifyStudy);}
