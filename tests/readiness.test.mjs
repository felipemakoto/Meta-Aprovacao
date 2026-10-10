import test from 'node:test';
import assert from 'node:assert/strict';
import {launchReadiness,readinessReport} from '../src/lib/subscriptions/readiness.ts';
import {checkoutEnabled} from '../src/lib/subscriptions/checkout-launch.ts';
const date='2026-10-10T12:00:00Z',now=Date.parse(date);
const env={CAKTO_PRODUCT_ID:'fixture',CAKTO_REGULAR_OFFER_ID:'offer',CAKTO_OCTOBER_OFFER_ID:'offer',CAKTO_REGULAR_CHECKOUT_URL:'https://pay.cakto.com.br/fixture',CAKTO_OCTOBER_CHECKOUT_URL:'https://pay.cakto.com.br/fixture?coupon=primeiracompra'};
function fixture(){return {sampledAt:date,health:{sampledAt:date,state:'ok',automation:{enabled:true,running:false,schedulerActive:true,lastFinishedAt:date,lastOk:true,nextDiscoveryAt:date},
 queue:{pending:0,queued:0,running:0,verified:0,review:0,retry:0,exhausted:0,expiredLeases:0,ready:0,oldestReadyAt:null},alerts:[],monitor:{active:true,lastCheckedAt:date},incidents:[]},
 questions:{draft:10,reviewed:0,published:0,usablePublished:0,missingAnswersPublished:0,diagnosticReady:false},
 subjects:['matematica','portugues','ciencias','historia','geografia'].map(subject=>({subject,draft:2,reviewed:0,published:0,usablePublished:0,missingForDiagnostic:2,usablePremiumSimulations:0})),
 simulations:{draft:2,published:0,unavailablePublished:0,usableFree:0,usableFreeQuick:0,usablePremium:0,usablePremiumBySubject:0},
 retentionInventory:{inbox:0,jobs:0,paymentChecks:0,lifecycleChecks:0,periods:0,renewalChecks:0,expiredCheckoutIntents:0,schedulerRuns:1}};}
test('conteúdo em rascunho e configuração correta não liberam venda; dados privados não saem',()=>{
 const f=fixture();f.secret='private';f.questions.answer='private';f.subjects[0].statement='private';f.retentionInventory.orderId='private';
 const r=launchReadiness(f,env,now);assert.equal(r.checks.operation,true);assert.equal(r.checks.localCheckoutConfiguration,true);
 assert.equal(r.checks.diagnosticContent,false);assert.equal(r.checks.premiumCatalog,false);assert.equal(r.launchApproved,false);assert.equal(r.checkoutEnabled,false);assert.equal(checkoutEnabled,false);
 assert.doesNotMatch(JSON.stringify(r),/private|orderId|statement|fixture|pay.cakto/);
 assert.match(readinessReport(f,env,now).text,/10 rascunhos/);assert.equal(launchReadiness(f,{},now).checks.localCheckoutConfiguration,false);
});
test('todos os indicadores técnicos podem passar sem transformar evidência sintética em aprovação comercial',()=>{
 const f=fixture();f.questions={draft:0,reviewed:0,published:10,usablePublished:10,missingAnswersPublished:0,diagnosticReady:true};
 f.subjects.forEach(s=>{s.draft=0;s.published=2;s.usablePublished=2;s.missingForDiagnostic=0;});f.subjects[0].usablePremiumSimulations=1;
 f.simulations={draft:0,published:2,unavailablePublished:0,usableFree:1,usableFreeQuick:1,usablePremium:1,usablePremiumBySubject:1};
 f.retentionInventory.paymentChecks=1;f.retentionInventory.periods=2;
 const r=launchReadiness(f,env,now);assert.ok(Object.values(r.checks).every(Boolean));assert.equal(r.launchApproved,false);assert.equal(r.checkoutEnabled,false);assert.ok(r.manualChecks.some(c=>c.includes('simulados')));
});
test('resposta inválida, matéria duplicada e somas inconsistentes não viram checagem aprovada',()=>{
 for(const mutate of [f=>f.questions.published=-1,f=>f.questions.draft=11,f=>f.questions.diagnosticReady=true,f=>f.subjects[0].missingForDiagnostic=0,f=>f.subjects[0].subject='unknown',f=>f.subjects[0].subject=f.subjects[1].subject,f=>f.simulations.usablePremium=1,f=>f.simulations.usableFreeQuick=1,f=>f.retentionInventory.paymentChecks='1',f=>f.sampledAt='private']){
  const f=fixture();mutate(f);assert.throws(()=>launchReadiness(f,env,now),/invalid_readiness/);
 }
 const f=fixture();assert.equal(launchReadiness(f,env,now+181000).checks.operation,false);
 f.health.automation.lastFinishedAt=null;f.health.automation.lastOk=null;assert.equal(launchReadiness(f,env,now).checks.operation,false);
 f.health.state='paused';f.health.automation.enabled=false;assert.equal(launchReadiness(f,env,now).checks.operation,false);
});
