import test from 'node:test';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:3000';
test('saldo real exige sessão verificada, sem cache e sem método de escrita',async()=>{
 for(const headers of [{},{Cookie:'sb-forged-auth-token=invalid'}]){const r=await fetch(origin+'/api/limits',{headers});assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'login_required'});assert.match(r.headers.get('cache-control'),/private, no-store/);}
 const cross=await fetch(origin+'/api/limits',{headers:{'sec-fetch-site':'cross-site'}});assert.equal(cross.status,403);
 assert.equal((await fetch(origin+'/api/limits',{method:'POST'})).status,405);
});
test('prévias ilustram saldo e esgotamento sem expor simulados não gratuitos',async()=>{
 for(const page of ['questoes','simulados']){const r=await fetch(origin+'/'+page+'/preview?limit=1');assert.equal(r.status,200);const html=await r.text();assert.match(html,/0 de/);assert.match(html,/meia-noite de São Paulo/);assert.match(html,/Dados ilustrativos/);}
 const html=await (await fetch(origin+'/simulados/preview')).text();const visible=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,'');assert.match(visible,/10 questões/);assert.doesNotMatch(visible,/20 questões/);
});
