import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL??'http://127.0.0.1:3000';
test('checkout real exige sessão, recusa destino do cliente e não oferece GET',async()=>{
 const endpoint=base+'/api/premium/checkout';
 const post=await fetch(endpoint,{method:'POST',headers:{origin:base},redirect:'manual'});
 assert.equal(post.status,401);assert.equal(post.headers.get('location'),null);assert.match(post.headers.get('cache-control'),/no-store/);
 const cross=await fetch(endpoint,{method:'POST',headers:{origin:'https://evil.example'}});assert.equal(cross.status,403);
 const arbitrary=await fetch(endpoint+'?url=https://evil.example',{method:'POST',headers:{origin:base}});assert.equal(arbitrary.status,400);
 assert.equal((await fetch(endpoint)).status,405);
});
test('Premium permanece com contratação indisponível e prévia não inicia cobrança',async()=>{
 const response=await fetch(base+'/premium/preview');assert.equal(response.status,200);
 const html=await response.text();assert.match(html,/disabled=""/);assert.match(html,/Contratação em breve/);
 assert.ok(!html.includes('https://pay.cakto.com.br/'));assert.ok(!html.includes('action="/api/premium/checkout"'));
});
