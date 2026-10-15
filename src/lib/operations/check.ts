import {healthReport} from "../subscriptions/health.ts";

export const operationMessages:Record<string,string>={offsite_missing:"Ainda não há cópia externa confirmada.",offsite_stale:"A última cópia externa confirmada tem mais de 48 horas.",offsite_failed:"A última tentativa de copiar o backup para o Drive falhou.",site_unavailable:"O site não respondeu normalmente.",health_unavailable:"Não foi possível consultar a operação de pagamentos.",monitor_unavailable:"O monitor de pagamentos está desatualizado.",scheduler_inactive:"O agendamento está desativado.",automation_stalled:"A busca de pedidos está atrasada.",automation_failed:"A última busca de pedidos falhou.",queue_stalled:"Há tarefas de pagamento paradas.",payments_review:"Há pagamentos que precisam de conferência.",payments_exhausted:"Há tarefas sem tentativas restantes.",backup_missing:"Ainda não há cópia de segurança verificada.",backup_stale:"A última cópia de segurança tem mais de 48 horas.",backup_failed:"A última tentativa de criar ou conferir a cópia de segurança falhou."};
export type OperationSnapshot={sampledAt:string;codes:string[];needsAttention:boolean;messages:string[]};
export async function checkOperations(deps:{site:()=>Promise<boolean>;health:()=>Promise<unknown>;lastBackup:()=>Promise<number|null>;backupFailed?:()=>Promise<boolean>;lastOffsite?:()=>Promise<number|null|undefined>;offsiteFailed?:()=>Promise<boolean>},now=Date.now()):Promise<OperationSnapshot>{
 const codes=new Set<string>();
 try{if(!await deps.site())codes.add("site_unavailable");}catch{codes.add("site_unavailable");}
 try{const report=healthReport(await deps.health(),now);for(const code of report.health.alerts)codes.add(code);if(!report.health.monitor.active||report.health.monitor.lastCheckedAt===null||now-Date.parse(report.health.monitor.lastCheckedAt)>180000)codes.add("monitor_unavailable");}catch{codes.add("health_unavailable");}
 try{const at=await deps.lastBackup();if(at===null||!Number.isFinite(at)||at>now)codes.add("backup_missing");else if(now-at>48*3600000)codes.add("backup_stale");}catch{codes.add("backup_missing");}
 if(deps.backupFailed)try{if(await deps.backupFailed())codes.add("backup_failed");}catch{codes.add("backup_failed");}
 if(deps.lastOffsite)try{const at=await deps.lastOffsite();if(at!==undefined){if(at===null||!Number.isFinite(at)||at>now)codes.add("offsite_missing");else if(now-at>48*3600000)codes.add("offsite_stale");}}catch{codes.add("offsite_missing");}
 if(deps.offsiteFailed)try{if(await deps.offsiteFailed())codes.add("offsite_failed");}catch{codes.add("offsite_failed");}
 const sorted=[...codes].sort();return {sampledAt:new Date(now).toISOString(),codes:sorted,needsAttention:sorted.length>0,messages:sorted.map(c=>operationMessages[c])};
}
export type NoticeState={candidate:string;count:number;notified:string};
export function nextNotice(previous:NoticeState,snapshot:OperationSnapshot){
 const key=snapshot.codes.join(",");
 const state={candidate:key,count:key===previous.candidate?previous.count+1:1,notified:previous.notified};
 const action=!key&&previous.notified?"recovery":key&&state.count>=2&&key!==previous.notified?"incident":"silent";
 return {action,state,key};
}
