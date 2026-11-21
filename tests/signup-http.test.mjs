import test from 'node:test';
import assert from 'node:assert/strict';
import {legalDocuments} from '../src/lib/auth/legal-documents.ts';
const origin=process.env.AUTH_TEST_BASE_URL || 'http://127.0.0.1:3000';
test('formulário e estado pendente acessíveis sem autenticação',async()=>{
 const page=await fetch(origin+'/cadastro');assert.equal(page.status,200);assert.match(await page.text(),/Criar conta/);
 const pending=await fetch(origin+'/cadastro/confirmado');assert.equal(pending.status,200);assert.match(await pending.text(),/Confirmação pendente/);
 // Next dev replaces HTML Cache-Control with no-cache, must-revalidate.
 assert.match(pending.headers.get('cache-control'),/no-store|no-cache, must-revalidate/);
});
test('HTTP rejeita cadastro inválido e CSRF sem criar usuário ou enviar e-mail',async()=>{
 for(const [headers,body,status] of [[{origin,'content-type':'application/json'},'{}',400],[{origin:'https://evil.example','content-type':'application/json'},'{}',403],[{origin,'content-type':'application/json'},'x'.repeat(2049),413]]) {
   const r=await fetch(origin+'/api/auth/signup',{method:'POST',headers,body});assert.equal(r.status,status);assert.match(r.headers.get('cache-control'),/no-store/);
 }
});
test('HTTP exige concordância sem chegar ao envio de confirmação',async()=>{
 const input={name:'Aluno Teste',email:'somente-teste@example.test',password:'teste-concordancia-59',confirmPassword:'teste-concordancia-59',legalVersion:legalDocuments.version};
 for(const acceptedLegal of [undefined,false,'true']){
  const response=await fetch(origin+'/api/auth/signup',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({...input,acceptedLegal})});
  assert.equal(response.status,400);assert.deepEqual(await response.json(),{error:'invalid_input'});
 }
});
test('callback inválido redireciona apenas para a página local de erro',async()=>{
 const r=await fetch(origin+'/auth/confirm?error=access_denied&next=https://evil.example',{redirect:'manual'});
 assert.equal(r.status,303);assert.equal(r.headers.get('location'),origin+'/cadastro/confirmacao-invalida');assert.match(r.headers.get('cache-control'),/no-store/);
});
