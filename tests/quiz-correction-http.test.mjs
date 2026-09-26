import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.GUEST_TEST_BASE_URL??'http://127.0.0.1:3000';
const answers=Array.from({length:10},(_,i)=>({questionId:`d1090000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,answer:'A'}));
const call=(method,headers={},body)=>fetch(`${base}/api/quiz/result`,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
test('HTTP: resultado exige cookie e não aceita origem externa',async()=>{
  assert.equal((await call('GET')).status,401);
  assert.equal((await call('POST',{Origin:base,'Content-Type':'application/json'},{answers})).status,401);
  assert.equal((await call('POST',{Origin:'https://evil.example','Content-Type':'application/json'},{answers})).status,403);
});
test('HTTP com Supabase: token desconhecido não pode ler nem corrigir tentativa',async()=>{
  assert.ok(process.env.SUPABASE_SECRET_KEY,'Chave deve estar configurada somente em .env.local');
  const headers={Origin:base,Cookie:`guest_quiz=${'f'.repeat(64)}`,'Content-Type':'application/json'};
  for(const method of ['GET','POST']) {
    const r=await call(method,headers,method==='POST'?{answers}:undefined);
    assert.equal(r.status,401);assert.deepEqual(await r.json(),{error:'attempt_unavailable'});
    assert.match(r.headers.get('cache-control'),/private.*no-store/);
  }
});
test('HTTP: cliente não pode forjar pontuação',async()=>{
  const r=await call('POST',{Origin:base,Cookie:`guest_quiz=${'f'.repeat(64)}`,'Content-Type':'application/json'},{answers,score:10});
  assert.equal(r.status,400);
});
test('API pública: novas RPCs não estão disponíveis ao visitante',async()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.ok(url&&key);
  for(const name of ['submit_guest_quiz','read_guest_quiz_result']) {
    const r=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},
      body:JSON.stringify({p_token_hash:'f'.repeat(64),...(name==='submit_guest_quiz'?{p_answers:answers}:{})}),signal:AbortSignal.timeout(15000)});
    assert.ok([401,403,404].includes(r.status));
    assert.ok(['42501','PGRST202'].includes((await r.json()).code));
  }
});
