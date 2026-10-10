import {healthReport} from "./health.ts";
import {configuredCheckout} from "./checkout-contract.ts";
import {checkoutEnabled} from "./checkout-launch.ts";
const subjects=["matematica","portugues","ciencias","historia","geografia"];
const manualChecks=[
 "Confirmar o contrato real de moeda, valores e campos da API Cakto.",
 "Validar pagamento e entrega comercial de ponta a ponta; testes simulados não comprovam uma compra.",
 "Registrar revisão humana do conteúdo antes de publicar.",
 "Definir retenção dos dados financeiros e do histórico técnico, sem apagar provas por engano.",
 "Conferir o horário/fuso de vencimento do cupom na Cakto e sua aplicação somente na primeira cobrança.",
 "Conferir configuração e disponibilidade da publicação de produção.",
];
function record(v:unknown):Record<string,unknown>{if(!v||typeof v!=="object"||Array.isArray(v))throw Error("invalid_readiness");return v as Record<string,unknown>;}
function count(v:unknown):number{if(typeof v!=="number"||!Number.isSafeInteger(v)||v<0)throw Error("invalid_readiness");return v;}
function counts<T extends string>(v:unknown,keys:readonly T[]):Record<T,number>{const r=record(v);return Object.fromEntries(keys.map(k=>[k,count(r[k])])) as Record<T,number>;}
export function launchReadiness(value:unknown,env:Record<string,string|undefined>,now=Date.now()) {
 if(!Number.isFinite(now))throw Error("invalid_readiness");
 const r=record(value),health=healthReport(r.health,now);
 if(typeof r.sampledAt!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(r.sampledAt)||!Number.isFinite(Date.parse(r.sampledAt)))throw Error("invalid_readiness");
 const q=counts(r.questions,["draft","reviewed","published","usablePublished","missingAnswersPublished"]);
 const diagnosticReady=record(r.questions).diagnosticReady;if(typeof diagnosticReady!=="boolean")throw Error("invalid_readiness");
 if(!Array.isArray(r.subjects)||r.subjects.length!==5)throw Error("invalid_readiness");
 const coverage=r.subjects.map(v=>{const s=record(v);if(typeof s.subject!=="string"||!subjects.includes(s.subject))throw Error("invalid_readiness");
  const n=counts(s,["draft","reviewed","published","usablePublished","missingForDiagnostic","usablePremiumSimulations"]);
  if(n.usablePublished>n.published||n.missingForDiagnostic!==Math.max(0,2-n.usablePublished))throw Error("invalid_readiness");
  return {subject:s.subject,...n};});
 if(new Set(coverage.map(s=>s.subject)).size!==5||diagnosticReady!==coverage.every(s=>s.usablePublished>=2))throw Error("invalid_readiness");
 for(const k of ["draft","reviewed","published","usablePublished"] as const)if(q[k]!==coverage.reduce((sum,s)=>sum+s[k],0))throw Error("invalid_readiness");
 if(q.missingAnswersPublished!==q.published-q.usablePublished)throw Error("invalid_readiness");
 const s=counts(r.simulations,["draft","published","unavailablePublished","usableFree","usableFreeQuick","usablePremium","usablePremiumBySubject"]);
 if(s.published!==s.unavailablePublished+s.usableFree+s.usablePremium||s.usableFreeQuick>s.usableFree||s.usablePremiumBySubject>s.usablePremium||s.usablePremiumBySubject!==coverage.reduce((sum,c)=>sum+c.usablePremiumSimulations,0))throw Error("invalid_readiness");
 const inventory=counts(r.retentionInventory,["inbox","jobs","paymentChecks","lifecycleChecks","periods","renewalChecks","expiredCheckoutIntents","schedulerRuns"]);
 let checkoutConfigured=false;
 try {configuredCheckout(env,new Date("2026-10-15T12:00:00Z"));configuredCheckout(env,new Date("2026-11-15T12:00:00Z"));checkoutConfigured=true;}catch{/* Boolean only; no URL/IDs or credentials in output. */}
 const checks={operation:health.health.automation.enabled&&health.health.automation.lastOk===true&&health.health.automation.lastFinishedAt!==null&&!health.needsAttention,diagnosticContent:diagnosticReady,
  practiceContent:q.usablePublished>0,freeQuickSimulation:s.usableFreeQuick>0,premiumCatalog:s.usablePremium>0,
  premiumBySubject:s.usablePremiumBySubject>0,localCheckoutConfiguration:checkoutConfigured};
 return {sampledAt:r.sampledAt,launchApproved:false as const,checkoutEnabled,checks,questions:{...q,diagnosticReady},subjects:coverage,simulations:s,retentionInventory:inventory,
  health:health.health,manualChecks:[...manualChecks]};
}
export function readinessReport(value:unknown,env:Record<string,string|undefined>,now=Date.now()) {
 const r=launchReadiness(value,env,now),labels:Record<keyof typeof r.checks,string>={operation:"Automação e monitoramento",diagnosticContent:"Conteúdo do diagnóstico",practiceContent:"Questões de prática",
  freeQuickSimulation:"Simulado rápido gratuito",premiumCatalog:"Catálogo Premium",premiumBySubject:"Simulados Premium por matéria",localCheckoutConfiguration:"Configuração local do checkout"};
 const lines=["Checagem de lançamento — aprovação comercial pendente.",`Checkout nesta versão: ${r.checkoutEnabled?"habilitado":"desativado"}.`,
  `Questões: ${r.questions.draft} rascunhos · ${r.questions.reviewed} revisadas · ${r.questions.usablePublished} publicadas com gabarito.`];
 for(const [key,ok] of Object.entries(r.checks))lines.push(`${ok?"OK":"PENDENTE"} · ${labels[key as keyof typeof r.checks]}`);
 lines.push("Ainda exige conferência:",...r.manualChecks.map(c=>`- ${c}`),"A checagem não publica conteúdo, concede acesso, apaga dados ou libera vendas.");
 return {data:r,text:lines.join("\n")};
}
