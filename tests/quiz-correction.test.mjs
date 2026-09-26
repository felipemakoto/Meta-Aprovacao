import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { createCorrectionHandlers, parseAnswers, toQuizResult } from '../src/lib/quiz/correction.ts';

const origin = 'https://estudos.example';
const token = 'a'.repeat(64);
const answers = Array.from({length:10},(_,i)=>({questionId:`d1090000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,answer:'A'}));
const result = {id:'attempt',completedAt:new Date().toISOString(),total:10,score:10,
  questions:answers.map((a,i)=>({id:a.questionId,position:i+1,subject:'matematica',topic:'Teste',statement:'Questão',options:['1','2','3','4','5'],answer:'A',correctAnswer:'A',correct:true,explanation:'Explicação'}))};
const req=(body={answers},headers={},method='POST',search='')=>new NextRequest(`${origin}/api/quiz/result${search}`,{method,headers:{Origin:origin,Cookie:`__Host-guest_quiz=${token}`,'Content-Type':'application/json',...headers},...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
const handlers=(overrides={},settings={secure:true,origin})=>createCorrectionHandlers({submit:async()=>result,read:async()=>result,...overrides},settings);

test('aceita somente dez pares únicos UUID/alternativa e nenhum campo de pontuação',()=>{
  assert.deepEqual(parseAnswers({answers}),answers);
  for(const body of [null,[],{}, {answers,score:10},{answers:answers.slice(1)}, {answers:[...answers,answers[0]]},
    {answers:answers.map(()=>answers[0])},...['F','a',null,1].map(answer=>({answers:answers.map(a=>({...a,answer}))})),
    {answers:answers.map(a=>({...a,questionId:'fake'}))},{answers:answers.map(a=>({...a,correct:true}))}]) assert.throws(()=>parseAnswers(body));
});
test('resultado permite somente feedback público, com consistência de score e alternativas',()=>{
  assert.deepEqual(toQuizResult({...result,token_hash:'secret',questions:result.questions.map(q=>({...q,private:'secret'}))}),result);
  assert.throws(()=>toQuizResult({...result,score:0}));
  assert.throws(()=>toQuizResult({...result,questions:result.questions.map(q=>({...q,correct:false}))}));
});
test('POST usa cookie como identidade, devolve resultado sem renovar prazo e sem cache',async()=>{
  let received;
  const r=await handlers({submit:async(...args)=>{received=args;return result;}}).POST(req());
  assert.equal(r.status,200);assert.deepEqual(received,[token,answers]);assert.deepEqual(await r.json(),result);
  assert.match(r.headers.get('cache-control'),/private.*no-store/);assert.equal(r.headers.get('set-cookie'),null);
});
test('CSRF, origem ausente e configuração insegura não chegam à correção',async()=>{
  const h=handlers({submit:async()=>{assert.fail('DAL chamada');}});
  for(const headers of [{Origin:''},{Origin:'https://evil.example'},{'Sec-Fetch-Site':'cross-site'}]) assert.equal((await h.POST(req(undefined,headers))).status,403);
  for(const settings of [{secure:true},{secure:true,origin:'http://estudos.example'},{secure:true,origin:'invalid'}]) assert.equal((await handlers({},settings).POST(req())).status,403);
});
test('cookie inválido ou ausente, query e tipo de conteúdo recusados',async()=>{
  for(const Cookie of ['', 'guest_quiz='+token,'__Host-guest_quiz=bad']) assert.equal((await handlers().POST(req(undefined,{Cookie}))).status,401);
  assert.equal((await handlers().POST(req(undefined,{},'POST','?id=other'))).status,400);
  assert.equal((await handlers().POST(req(undefined,{'Content-Type':'text/plain'}))).status,415);
});
test('corpo malformado, excessivo declarado e excessivo real são recusados',async()=>{
  const h=handlers({submit:async()=>assert.fail('DAL chamada')});
  assert.equal((await h.POST(req('{'))).status,400);
  assert.equal((await h.POST(req({answers,score:10}))).status,400);
  assert.equal((await h.POST(req(undefined,{'Content-Length':'5000'}))).status,413);
  assert.equal((await h.POST(req(' '.repeat(4097)))).status,413);
});
test('erros do banco têm status explícitos e falha interna não vaza mensagem',async()=>{
  for(const [message,status] of [['attempt_unavailable',401],['attempt_already_submitted',409],['invalid_answers',400],['secret internal error',503]]) {
    const r=await handlers({submit:async()=>{throw new Error(message);}}).POST(req());
    assert.equal(r.status,status);assert.deepEqual(await r.json(),{error:status===503?'quiz_unavailable':message});
  }
});
test('GET exige cookie, recusa cross-site e não dá resultado antes da conclusão',async()=>{
  assert.equal((await handlers().GET(req(undefined,{Cookie:''},'GET'))).status,401);
  assert.equal((await handlers().GET(req(undefined,{'Sec-Fetch-Site':'cross-site'},'GET'))).status,403);
  assert.equal((await handlers().GET(req(undefined,{},'GET','?id=other'))).status,400);
  assert.equal((await handlers({read:async()=>null}).GET(req(undefined,{},'GET'))).status,401);
  assert.deepEqual(await (await handlers().GET(req(undefined,{},'GET'))).json(),result);
});
