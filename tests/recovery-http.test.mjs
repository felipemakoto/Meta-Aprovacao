import test from 'node:test';
import assert from 'node:assert/strict';
const origin=process.env.AUTH_TEST_BASE_URL || 'http://127.0.0.1:3000';
test('solicitação pública; página protegida não libera senha sem recuperação',async()=>{
 const r=await fetch(origin+'/recuperar-senha');assert.equal(r.status,200);assert.match(await r.text(),/Enviar link/);
 const p=await fetch(origin+'/nova-senha');assert.match(await p.text(),/Solicite um novo link/);assert.match(p.headers.get('cache-control'),/no-store|no-cache, must-revalidate/);
});
test('HTTP impede CSRF, GET e payload inválido sem enviar e-mail',async()=>{
 for(const route of ['recovery','password']) {
  assert.equal((await fetch(origin+'/api/auth/'+route)).status,405);
  for(const [headers,body,status] of [[{origin:'https://evil.example','content-type':'application/json'},'{}',403],[{origin,'content-type':'application/json'},'{}',400],[{origin,'content-type':'application/json'},'x'.repeat(2049),413]]) {
   const r=await fetch(origin+'/api/auth/'+route,{method:'POST',headers,body});assert.equal(r.status,status);assert.match(r.headers.get('cache-control'),/no-store/);
  }
 }
});
test('senha válida sem sessão de recuperação recebe 401 sem alteração',async()=>{
 const r=await fetch(origin+'/api/auth/password',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({password:'apenas-teste-123',confirmPassword:'apenas-teste-123'})});
 assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'recovery_required'});
});
