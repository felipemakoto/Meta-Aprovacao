import test from 'node:test';
import assert from 'node:assert/strict';
import {legalDocuments} from '../src/lib/auth/legal-documents.ts';
const origin=process.env.AUTH_TEST_BASE_URL??'http://127.0.0.1:3000';
test('status do provedor expõe só disponibilidade e cadastro não mostra a frase retirada',async()=>{
 const response=await fetch(origin+'/api/auth/google/status');assert.equal(response.status,200);
 const body=await response.json();assert.deepEqual(Object.keys(body),['enabled']);assert.equal(typeof body.enabled,'boolean');assert.match(response.headers.get('cache-control'),/no-store/);
 const page=await fetch(origin+'/cadastro');assert.equal(page.status,200);assert.doesNotMatch(await page.text(),/Confirme o e-mail para começar a estudar/);
});
test('início rejeita concordância inválida e CSRF sem conta ou autorização Google',async()=>{
 for(const [headers,body,status] of [[{origin,'content-type':'application/json'},{acceptedLegal:false,legalVersion:legalDocuments.version},400],[{origin:'https://evil.example','content-type':'application/json'},{},403]]){
  const response=await fetch(origin+'/api/auth/google',{method:'POST',headers,body:JSON.stringify(body)});assert.equal(response.status,status);assert.match(response.headers.get('cache-control'),/no-store/);
 }
 const availability=await (await fetch(origin+'/api/auth/google/status')).json();
 if(!availability.enabled){const response=await fetch(origin+'/api/auth/google',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({acceptedLegal:true,legalVersion:legalDocuments.version})});assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'google_unavailable'});assert.equal(response.headers.has('set-cookie'),false);}
});
test('retorno sem cookie válido vai para erro local, sem usar destino externo ou preservar código',async()=>{
 const response=await fetch(origin+'/auth/google/callback?code=abcdefghijklmnop&next=https://evil.example',{redirect:'manual'});
 assert.equal(response.status,303);assert.equal(response.headers.get('location'),origin+'/auth/google/erro');assert.equal(response.headers.get('referrer-policy'),'no-referrer');
 const page=await fetch(origin+'/auth/google/erro');assert.equal(page.status,200);assert.match(await page.text(),/Vamos tentar de novo/);
});
