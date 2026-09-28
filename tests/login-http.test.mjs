import test from 'node:test';
import assert from 'node:assert/strict';
const origin=process.env.AUTH_TEST_BASE_URL || 'http://127.0.0.1:3000';
test('login público é dinâmico e não aceita GET para mutações',async()=>{
 const r=await fetch(origin+'/login');assert.equal(r.status,200);assert.match(await r.text(),/Use seu e-mail e sua senha/);
 assert.match(r.headers.get('cache-control'),/no-store|no-cache, must-revalidate/);
 for(const route of ['login','logout']) assert.equal((await fetch(origin+'/api/auth/'+route)).status,405);
});
test('HTTP bloqueia CSRF e corpo inválido antes da autenticação',async()=>{
 for(const route of ['login','logout']) {
  for(const [headers,body,status] of [[{origin:'https://evil.example','content-type':'application/json'},'{}',403],[{origin,'content-type':'application/json'},'{',400],[{origin,'content-type':'application/json'},'x'.repeat(4097),413]]) {
   const r=await fetch(origin+'/api/auth/'+route,{method:'POST',headers,body});assert.equal(r.status,status);assert.match(r.headers.get('cache-control'),/no-store/);
  }
 }
});
test('logout sem sessão é idempotente e não autentica',async()=>{
 const r=await fetch(origin+'/api/auth/logout',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'});
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{status:'signed_out'});
 assert.equal((await fetch(origin+'/api/auth/status')).status,401);
});
