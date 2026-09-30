import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server.js';
import {parsePracticeInput,publicQuestion} from '../src/lib/quiz/practice-contract.ts';
import {createPracticeHandlers} from '../src/lib/quiz/practice-http.ts';
const id='00000000-0000-4000-8000-000000000019';
const next={action:'next',filters:{subject:'matematica',topic:'',difficulty:'all',exam:'all'},previous:null};
const q={id,questionId:id,expiresAt:'2030-01-01T00:00:00Z',subject:'matematica',topic:'Teste',statement:'Teste',options:['1','2','3','4','5']};
const origin='https://study.example';
const req=(body=next,headers={},search='')=>new NextRequest(origin+'/api/practice'+search,{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const h=(deps={},settings={secure:true,origin})=>createPracticeHandlers({user:async()=>'verified-user',topics:async()=>[],run:async()=>q,...deps},settings);
test('filtros e resposta exatos; usuário, score, alternativa inválida e SQL não entram',()=>{
 assert.deepEqual(parsePracticeInput(next),next);
 for(const v of [{...next,userId:id},{action:'answer',id,answer:'F'},{action:'answer',id,answer:'A',score:10},{...next,filters:{...next.filters,subject:'x OR true'}},{...next,filters:{...next.filters,difficulty:'premium'}},{...next,filters:{...next.filters,topic:'x'.repeat(161)}}])assert.throws(()=>parsePracticeInput(v));
});
test('leitura retira gabarito, explicação e campos privados',()=>{
 assert.deepEqual(publicQuestion({...q,correctAnswer:'B',explanation:'secret',user_id:'secret'}),q);
});
test('API usa identidade verificada, retorna questão sem gabarito e sem cache',async()=>{
 let args;const r=await h({run:async(...a)=>{args=a;return {...q,correctAnswer:'B'}}}).POST(req());
 assert.equal(r.status,200);assert.deepEqual(args,['verified-user',next]);assert.deepEqual(await r.json(),{question:q});assert.match(r.headers.get('cache-control'),/private.*no-store/);
});
test('CSRF e input abusivo bloqueados antes da DAL',async()=>{
 const deps={run:async()=>assert.fail('run')};
 for(const headers of [{origin:''},{origin:'https://evil.example'},{'sec-fetch-site':'cross-site'}])assert.equal((await h(deps).POST(req(next,headers))).status,403);
 assert.equal((await h(deps,{secure:true}).POST(req())).status,403);
 assert.equal((await h(deps).POST(req(next,{},'?user=other'))).status,400);
 assert.equal((await h(deps).POST(req('x'.repeat(2049)))).status,413);
 assert.equal((await h(deps).POST(req('{'))).status,400);
});
test('ausência de sessão, tentativas de outra conta/expiradas e falhas têm respostas distintas',async()=>{
 assert.equal((await h({user:async()=>null}).POST(req())).status,401);
 for(const [error,status]of [['attempt_unavailable',404],['already_answered',409],['rate_limited',429],['secret',503]]){
  const r=await h({run:async()=>{throw new Error(error)}}).POST(req());assert.equal(r.status,status);assert.equal((await r.text()).includes('secret'),false);
 }
});
test('feedback só após resposta; inconsistência não vira sucesso',async()=>{
 const feedback={answer:'A',correct:false,correctAnswer:'B',explanation:'Explicação'};
 const r=await h({run:async()=>feedback}).POST(req({action:'answer',id,answer:'A'}));assert.deepEqual(await r.json(),{feedback});
 assert.equal((await h({run:async()=>({...feedback,correct:true})}).POST(req({action:'answer',id,answer:'A'}))).status,503);
});
test('GET aceita uma matéria válida, exige sessão e retorna só assuntos',async()=>{
 const get=s=>new NextRequest(origin+'/api/practice'+s);
 assert.equal((await h().GET(get('?subject=matematica&subject=ciencias'))).status,400);
 assert.equal((await h({user:async()=>null}).GET(get('?subject=matematica'))).status,401);
 assert.deepEqual(await (await h().GET(get('?subject=matematica'))).json(),{topics:[]});
});
