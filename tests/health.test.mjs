import test from 'node:test';
import assert from 'node:assert/strict';
import {operationalHealth,healthReport} from '../src/lib/subscriptions/health.ts';
const date='2026-10-10T13:00:00.123456+00:00',now=Date.parse(date);
const fixture=()=>({sampledAt:date,state:'ok',automation:{enabled:true,running:false,schedulerActive:true,lastFinishedAt:date,lastOk:true,nextDiscoveryAt:date},
 queue:{pending:0,queued:0,running:0,verified:0,review:0,retry:0,exhausted:0,expiredLeases:0,ready:0,oldestReadyAt:null},alerts:[],monitor:{active:true,lastCheckedAt:date},incidents:[]});
test('projeção administrativa remove campos privados em todos os níveis',()=>{
 const v=fixture();v.secret='private';v.automation.productId='private';v.queue.customer='private';v.monitor.token='private';
 v.incidents=[{code:'automation_failed',firstSeenAt:date,lastSeenAt:date,resolvedAt:date,occurrences:1,userId:'private'}];
 const result=operationalHealth(v);assert.doesNotMatch(JSON.stringify(result),/private|productId|userId|secret|token/);assert.equal(result.incidents[0].occurrences,1);
 assert.equal(healthReport(v,now).needsAttention,false);assert.match(healthReport(v,now).text,/funcionando/);
});
test('falha de contrato não vira resultado saudável; mensagens arbitrárias não são exibidas',()=>{
 for(const alter of [v=>v.state='other',v=>v.queue.ready=-1,v=>v.queue.review='2',v=>v.automation.enabled=1,v=>v.automation.lastOk='private',v=>v.alerts=['private'],v=>v.alerts=['__proto__'],v=>v.sampledAt='private',v=>v.incidents=[{code:'automation_failed',firstSeenAt:date,lastSeenAt:date,resolvedAt:null,occurrences:0}],v=>{v.state='attention';},v=>{v.alerts=['automation_failed'];v.state='attention';v.alerts.push('automation_failed');}]){
  const v=fixture();alter(v);assert.throws(()=>operationalHealth(v),/invalid_health/);
 }
});
test('pausa não se confunde com falha; pendência, monitor parado e atraso pedem atenção',()=>{
 let v=fixture();v.state='paused';v.automation.enabled=false;
 assert.equal(healthReport(v,now).needsAttention,false);assert.match(healthReport(v,now).text,/pausada/);
 v=fixture();v.state='attention';v.alerts=['payments_review','payments_exhausted'];v.queue.review=2;v.queue.exhausted=1;
 assert.equal(healthReport(v,now).needsAttention,true);assert.match(healthReport(v,now).text,/revisão administrativa/);
 v=fixture();v.monitor.active=false;assert.equal(healthReport(v,now).needsAttention,true);
 v=fixture();v.monitor.lastCheckedAt=null;assert.equal(healthReport(v,now).needsAttention,true);
 v=fixture();assert.equal(healthReport(v,now+181000).needsAttention,true);assert.equal(healthReport(v,now+179000).needsAttention,false);
});
