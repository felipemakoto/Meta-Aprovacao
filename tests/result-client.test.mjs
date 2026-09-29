import test from 'node:test';
import assert from 'node:assert/strict';
import { requestResult, ResultRequestError } from '../src/lib/quiz/result-client.ts';
const answers=Array.from({length:10},(_,i)=>({questionId:`q-${i}`,answer:'A'}));
const fixture={id:'result',completedAt:'2026-09-26T00:00:00Z',total:10,score:10,
  questions:answers.map((a,i)=>({id:a.questionId,position:i+1,subject:'matematica',topic:'Teste',statement:'Teste',options:['1','2','3','4','5'],answer:'A',correctAnswer:'A',correct:true,explanation:'Explicação'}))};
test('resultado salvo usa endpoint autenticado sem ID fornecido pelo cliente',async t=>{
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.equal(url,'/api/quiz/saved');assert.equal(options.method,'GET');
    assert.equal(options.body,undefined);assert.equal(options.cache,'no-store');
    return Response.json(fixture);
  });
  assert.deepEqual(await requestResult(undefined,true),fixture);
});
test('envio contém somente escolhas; retry mantém o corpo e cookies same-origin',async t=>{
  const calls=[];
  t.mock.method(globalThis,'fetch',async(url,options)=>{calls.push({url,options});return Response.json(fixture);});
  assert.deepEqual(await requestResult(answers),fixture);
  await requestResult(answers);
  assert.equal(calls[0].url,'/api/quiz/result');
  assert.equal(calls[0].options.method,'POST');
  assert.equal(calls[0].options.credentials,'same-origin');
  assert.equal(calls[0].options.cache,'no-store');
  assert.deepEqual(JSON.parse(calls[0].options.body),{answers});
  assert.equal(calls[0].options.body,calls[1].options.body);
});
test('retomada usa GET sem reenviar respostas',async t=>{
  t.mock.method(globalThis,'fetch',async(_,options)=>{
    assert.equal(options.method,'GET');assert.equal(options.body,undefined);return Response.json(fixture);
  });
  assert.deepEqual(await requestResult(),fixture);
});
test('401, 409 e 503 permanecem distinguíveis para a interface',async t=>{
  for(const status of [401,409,503]) {
    const mock=t.mock.method(globalThis,'fetch',async()=>Response.json({error:'private-details'},{status}));
    await assert.rejects(()=>requestResult(answers),e=>e instanceof ResultRequestError&&e.status===status&&!e.message.includes('private-details'));
    mock.mock.restore();
  }
});
test('JSON inválido e score inconsistente não viram resultado visível',async t=>{
  t.mock.method(globalThis,'fetch',async()=>Response.json({...fixture,score:7}));
  await assert.rejects(()=>requestResult());
});
