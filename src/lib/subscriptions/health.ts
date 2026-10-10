// Administrative display: strict projection; never print arbitrary RPC values or errors.
const messages:Record<string,string>={
 scheduler_inactive:"O agendamento de pagamentos está desativado.",
 automation_stalled:"A busca de pedidos está atrasada há mais de cinco minutos.",
 automation_failed:"A última execução terminou com falha.",
 queue_stalled:"Há tarefas prontas aguardando há mais de dez minutos.",
 payments_review:"Há pagamentos que precisam de revisão administrativa.",
 payments_exhausted:"Há tarefas que esgotaram as tentativas automáticas.",
};
const queueKeys=["pending","queued","running","verified","review","retry","exhausted","expiredLeases","ready"] as const;
function object(value:unknown):Record<string,unknown> {
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("invalid_health");
 return value as Record<string,unknown>;
}
function date(value:unknown,nullable=true):string|null {
 if(value===null&&nullable)return null;
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))throw Error("invalid_health");
 return value;
}
function boolean(value:unknown):boolean {if(typeof value!=="boolean")throw Error("invalid_health");return value;}
function count(value:unknown):number {if(typeof value!=="number"||!Number.isSafeInteger(value)||value<0)throw Error("invalid_health");return value;}
function code(value:unknown):string {if(typeof value!=="string"||!Object.hasOwn(messages,value))throw Error("invalid_health");return value;}
export function operationalHealth(value:unknown) {
 const r=object(value),a=object(r.automation),q=object(r.queue),m=object(r.monitor);
 if(!["ok","attention","paused"].includes(String(r.state))||!Array.isArray(r.alerts)||r.alerts.length>6||!Array.isArray(r.incidents)||r.incidents.length>6)throw Error("invalid_health");
 const alerts=r.alerts.map(code);if(new Set(alerts).size!==alerts.length)throw Error("invalid_health");
 const enabled=boolean(a.enabled),lastOk=a.lastOk===null?null:boolean(a.lastOk),state=r.state as "ok"|"attention"|"paused";
 if(state!==(alerts.length?"attention":enabled?"ok":"paused"))throw Error("invalid_health");
 const incidents=r.incidents.map(value=>{const i=object(value),occurrences=count(i.occurrences);if(!occurrences)throw Error("invalid_health");
  return {code:code(i.code),firstSeenAt:date(i.firstSeenAt,false)!,lastSeenAt:date(i.lastSeenAt,false)!,resolvedAt:date(i.resolvedAt),occurrences};});
 if(new Set(incidents.map(i=>i.code)).size!==incidents.length)throw Error("invalid_health");
 const counts=Object.fromEntries(queueKeys.map(k=>[k,count(q[k])])) as Record<typeof queueKeys[number],number>;
 return {sampledAt:date(r.sampledAt,false)!,state,
  automation:{enabled,running:boolean(a.running),schedulerActive:boolean(a.schedulerActive),lastFinishedAt:date(a.lastFinishedAt),lastOk,nextDiscoveryAt:date(a.nextDiscoveryAt,false)!},
  queue:{...counts,oldestReadyAt:date(q.oldestReadyAt)},
  alerts,monitor:{active:boolean(m.active),lastCheckedAt:date(m.lastCheckedAt)},incidents};
}
export function healthReport(value:unknown,now=Date.now()) {
 const h=operationalHealth(value),monitorLate=!h.monitor.active||h.monitor.lastCheckedAt===null||now-Date.parse(h.monitor.lastCheckedAt)>180000;
 const heading=h.state==="ok"&&!monitorLate?"Operação Cakto: funcionando.":h.state==="paused"&&!monitorLate?"Operação Cakto: pausada.":"Operação Cakto: precisa de atenção.";
 const recent=h.automation.lastFinishedAt?new Date(h.automation.lastFinishedAt).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}):"ainda não registrada";
 const lines=[heading,`Última conclusão: ${recent}.`,
  `Fila: ${h.queue.ready} prontas · ${h.queue.running} em execução · ${h.queue.review} em revisão · ${h.queue.exhausted} sem tentativas restantes.`];
 for(const alert of h.alerts)lines.push(messages[alert]);
 if(monitorLate)lines.push("O monitor não está ativo ou não registrou uma verificação nos últimos três minutos.");
 if(h.state==="paused")lines.push("Novos disparos estão pausados; períodos pagos permanecem preservados.");
 lines.push("Este diagnóstico não confirma uma compra nem libera o checkout.");
 return {text:lines.join("\n"),needsAttention:h.state==="attention"||monitorLate,health:h};
}
