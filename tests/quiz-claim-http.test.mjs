import test from 'node:test';
import assert from 'node:assert/strict';
const origin=process.env.AUTH_TEST_BASE_URL || 'http://127.0.0.1:3000';
test('HTTP real: sem sessão não lê nem salva, respostas privadas',async()=>{
 for(const method of ['GET','POST']) {
  const r=await fetch(origin+'/api/quiz/saved',{method,headers:{origin}});
  assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'login_required'});
  assert.match(r.headers.get('cache-control'),/private.*no-store/);
 }
});
test('HTTP real: CSRF, payload e query não chegam à associação',async()=>{
 for(const [url,options,status] of [
  ['/api/quiz/saved',{method:'POST',headers:{origin:'https://evil.example'}},403],
  ['/api/quiz/saved',{method:'POST',headers:{origin},body:'{"userId":"other"}'},400],
  ['/api/quiz/saved?userId=other',{},400],
 ]) assert.equal((await fetch(origin+url,options)).status,status);
});
test('HTTP real: rota salva e prévia disponíveis em desenvolvimento',async()=>{
 const r=await fetch(origin+'/quiz/result/saved');assert.equal(r.status,200);
 const p=await fetch(origin+'/quiz/result/preview');assert.equal(p.status,200);
 const html=await p.text();assert.match(html,/Salvar na minha conta/);assert.match(html,/disabled/);
});
