import test from 'node:test';
import assert from 'node:assert/strict';
import {automationHandler,automationHeaders} from '../src/lib/subscriptions/automation-http.ts';
import {runCaktoAutomation} from '../src/lib/subscriptions/automation.ts';
const secret='a'.repeat(64),token='00000000-0000-4000-8000-000000000034',order='00000000-0000-4000-8000-000000000035';
const lease={token,mode:'discovery',product:'fixture',offers:['offer'],since:'2026-10-02T00:00:00Z',until:'2026-10-09T00:00:00Z',page:1,offset:0};
const provider={recentOrderIds:async()=>({orderIds:[],hasMore:false}),orderAndSubscription:async()=>{throw Error('private');}};
test('endpoint exige assinatura válida e chamada vazia; nenhuma configuração vem do navegador',async()=>{
 let calls=0;const authorize=async()=>true,handler=automationHandler({secret:()=>secret,authorize,run:async()=>{calls++;return {skipped:true};}});
 const request=(headers={},body='{}',method='POST',query='')=>new Request('https://example.com/worker'+query,{method,headers:{...automationHeaders(secret,'b'.repeat(64),Date.now()),...headers},...(method==='POST'?{body}:{})});
 for(const value of ['',secret,'Bearer '+'b'.repeat(64),'Bearer '+'é'.repeat(64)])assert.equal((await handler(request({authorization:value}))).status,401);
 assert.equal((await handler(request({},undefined,'GET'))).status,405);
 for(const body of ['','{"premium":true}','{"mode":"jobs"}','x'.repeat(17)])assert.equal((await handler(request({},body))).status,400);
 assert.equal((await handler(request({},'{}','POST','?page=2'))).status,400);
 assert.equal((await handler(request({'sec-fetch-site':'cross-site'}))).status,400);
 assert.equal(calls,0);const r=await handler(request());assert.equal(r.status,200);assert.deepEqual(await r.json(),{skipped:true});assert.match(r.headers.get('cache-control'),/no-store/);
 const failed=await automationHandler({secret:()=>secret,authorize,run:async()=>{throw Error('private token');}})(request());assert.deepEqual(await failed.json(),{error:'automation_unavailable'});
 assert.equal((await automationHandler({secret:()=>'',authorize,run:async()=>{calls++;}})(request())).status,503);
 assert.equal((await handler(request({'x-cakto-worker-timestamp':'1000000000'}))).status,401);
 const valid=automationHeaders(secret,'b'.repeat(64),Date.now());
 assert.equal((await handler(request({authorization:valid.Authorization.slice(0,-1)+(valid.Authorization.endsWith('0')?'1':'0')}))).status,401);
 assert.equal((await handler(request(automationHeaders(secret,'b'.repeat(64),Date.now()-91000)))).status,401);
 assert.equal((await automationHandler({secret:()=>secret,authorize:async()=>false,run:async()=>{throw Error();}})(request())).status,401);
});
test('pausa ou reserva ativa não chama API; lote vazio conclui scan sem dados privados',async()=>{
 const out=await runCaktoAutomation(async()=>null,provider);assert.deepEqual(out,{skipped:true});
 const calls=[];const result=await runCaktoAutomation(async(name,args)=>{calls.push([name,args]);return name==='lease_cakto_automation'?lease:null;},provider);
 assert.equal(result.mode,'discovery');assert.deepEqual(result.summary,{matched:0,ignored:0,truncated:0});assert.equal(calls.at(-1)[1].p_done,true);
});
test('cursor persistido avança um pedido, página e limite máximo; falha não avança',async()=>{
 for(const [a,ids,hasMore,expected] of [[lease,[order,token],true,{p_page:1,p_offset:1,p_done:false}],[{...lease,offset:1},[order,token],true,{p_page:2,p_offset:0,p_done:false}],[{...lease,page:100},[order],true,{p_page:100,p_offset:0,p_done:true}]]){
  let finish;const seen=[];const result=await runCaktoAutomation(async(name,args)=>{if(name==='finish_cakto_automation')finish=args;return name==='lease_cakto_automation'?a:null;},{recentOrderIds:async()=>({orderIds:ids,hasMore}),orderAndSubscription:async id=>{seen.push(id);return {order:{id,product:{id:'foreign'}},subscription:null};}});
  for(const [k,v] of Object.entries(expected))assert.equal(finish[k],v);assert.equal(seen.length,1);assert.equal(result.summary.truncated,a.page===100?1:0);
 }
 let finish;await assert.rejects(()=>runCaktoAutomation(async(name,args)=>{if(name==='finish_cakto_automation')finish=args;return name==='lease_cakto_automation'?lease:null;},{...provider,recentOrderIds:async()=>{throw Error('secret');}}),/automation_unavailable/);
 assert.equal(finish.p_ok,false);assert.deepEqual(finish.p_summary,{failed:1});assert.equal(finish.p_page,undefined);
});
test('dois jobs no máximo e resultados mínimos sem evidência em resposta',async()=>{
 let n=0;const saves=[];const jobs={...lease,mode:'jobs'};
 const result=await runCaktoAutomation(async(name,args)=>{
  if(name==='lease_cakto_automation')return jobs;
  if(name==='lease_cakto_payment_job')return {eventId:++n,leaseToken:token,attempt:1};
  if(name==='read_cakto_payment_signal')return {event:'purchase_approved',orderId:order,productId:'fixture',offerId:'foreign'};
  if(name==='finish_cakto_payment_job'){saves.push(args);return null;}return null;
 },provider);
 assert.equal(n,2);assert.equal(saves.length,2);assert.deepEqual(result.summary,{processed:2,verified:0,review:2,retry:0,failed:0});assert.doesNotMatch(JSON.stringify(result),/orderId|leaseToken|foreign/);
});
