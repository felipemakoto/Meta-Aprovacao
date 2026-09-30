import test from 'node:test';
import assert from 'node:assert/strict';
const origin='http://127.0.0.1:4175';
test('demonstração serve somente assets e não permite conexão a APIs',async()=>{
  for(const path of ['/','/app.js','/app.css','/base.css','/icons/arrow-right.svg']){
    const r=await fetch(origin+path);assert.equal(r.status,200);
    assert.match(r.headers.get('content-security-policy'),/connect-src 'none'/);
    assert.equal(r.headers.get('set-cookie'),null);
  }
  for(const path of ['/api/practice','/.env.local','/login','/src/app/questoes/practice.tsx'])assert.equal((await fetch(origin+path)).status,404);
  assert.equal((await fetch(origin+'/',{method:'POST'})).status,405);
});
test('fontes locais disponíveis sem baixar ativos externos',async()=>{
  const css=await (await fetch(origin+'/base.css')).text();
  const fonts=[...css.matchAll(/url\("?(\/fonts\/[^"\)]+)"?\)/g)].map(m=>m[1]);
  assert.ok(fonts.length>0);
  for(const font of new Set(fonts))assert.equal((await fetch(origin+font)).status,200);
});
