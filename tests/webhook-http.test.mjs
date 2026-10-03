import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:3000';
test('endpoint real não oferece GET e sem segredo configurado falha fechado',async()=>{
 const url=base+'/api/webhooks/cakto';
 assert.equal((await fetch(url)).status,405);
 const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({secret:'forged',event:'purchase_approved',data:{}})});
 assert.ok([401,503].includes(r.status));
 assert.match(r.headers.get('cache-control'),/no-store/);
 assert.deepEqual(await r.json(),{received:false});
});
