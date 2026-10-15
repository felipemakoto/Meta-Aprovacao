import test from 'node:test';import assert from 'node:assert/strict';import {checkOperations,nextNotice} from '../src/lib/operations/check.ts';
const now=Date.parse('2026-10-15T20:00:00Z'),date=new Date(now).toISOString();
function health(){return {sampledAt:date,state:'ok',automation:{enabled:true,running:false,schedulerActive:true,lastFinishedAt:date,lastOk:true,nextDiscoveryAt:date},queue:{pending:0,queued:0,running:0,verified:0,review:0,retry:0,exhausted:0,expiredLeases:0,ready:0,oldestReadyAt:null},alerts:[],monitor:{active:true,lastCheckedAt:date},incidents:[]};}
const deps=()=>({site:async()=>true,health:async()=>health(),lastBackup:async()=>now});
test('operação saudável é silenciosa e pausa intencional não inventa falha',async()=>{
 const ok=await checkOperations(deps(),now);assert.equal(ok.needsAttention,false);const paused=health();paused.state='paused';paused.automation.enabled=false;
 assert.deepEqual((await checkOperations({...deps(),health:async()=>paused},now)).codes,[]);
});
test('falhas externas e de contrato geram códigos, sem propagar conteúdo privado',async()=>{
 const r=await checkOperations({site:async()=>{throw Error('private-url')},health:async()=>({secret:'private-token'}),lastBackup:async()=>null},now);
 assert.deepEqual(r.codes,['backup_missing','health_unavailable','site_unavailable']);assert.doesNotMatch(JSON.stringify(r),/private-url|private-token/);
});
test('backup atrasado e monitor parado são detectados mesmo sem alerta do banco',async()=>{
 const h=health();h.monitor.lastCheckedAt=new Date(now-181000).toISOString();
 assert.deepEqual((await checkOperations({...deps(),health:async()=>h,lastBackup:async()=>now-49*3600000},now)).codes,['backup_stale','monitor_unavailable']);
 assert.deepEqual((await checkOperations({...deps(),lastBackup:async()=>now+1},now)).codes,['backup_missing']);
});
test('duas amostras confirmam incidente, repetição é silenciosa e recuperação é única após confirmação do envio',()=>{
 const bad={codes:['site_unavailable']},good={codes:[]},initial={candidate:'',count:0,notified:''};
 const first=nextNotice(initial,bad);assert.equal(first.action,'silent');const second=nextNotice(first.state,bad);assert.equal(second.action,'incident');
 assert.equal(nextNotice(second.state,bad).action,'incident');
 const sent={...second.state,notified:second.key};assert.equal(nextNotice(sent,bad).action,'silent');
 const recovery=nextNotice(sent,good);assert.equal(recovery.action,'recovery');assert.equal(nextNotice({...recovery.state,notified:''},good).action,'silent');
});
test('tentativa de backup que falhou gera alerta mesmo se a cópia anterior ainda for recente',async()=>{
 assert.deepEqual((await checkOperations({...deps(),backupFailed:async()=>true},now)).codes,['backup_failed']);
});
