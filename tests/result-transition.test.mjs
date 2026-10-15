import test from 'node:test';
import assert from 'node:assert/strict';
import {RESULT_TRANSITION_MS,withResultTransition} from '../src/lib/quiz/result-transition.ts';

test('operação começa imediatamente, mas resposta rápida aguarda a transição visual',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 assert.equal(RESULT_TRANSITION_MS,10000);
 let calls=0,settled=false;const result={score:7};
 const pending=withResultTransition(async()=>{calls++;return result;});
 pending.then(()=>{settled=true;});assert.equal(calls,1);
 await Promise.resolve();t.mock.timers.tick(RESULT_TRANSITION_MS-1);await Promise.resolve();assert.equal(settled,false);
 t.mock.timers.tick(1);assert.equal(await pending,result);assert.equal(calls,1);
});

test('resposta lenta não recebe uma segunda espera após terminar',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 let complete,settled=false;
 const pending=withResultTransition(()=>new Promise(resolve=>{complete=resolve;}));
 pending.then(()=>{settled=true;});t.mock.timers.tick(RESULT_TRANSITION_MS+1000);await Promise.resolve();assert.equal(settled,false);
 complete('ready');assert.equal(await pending,'ready');
});

test('erros continuam distinguíveis e não provocam repetição automática',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});
 for(const synchronous of [false,true]){
  const failure=new Error('failed');let calls=0;
  const pending=withResultTransition(()=>{calls++;if(synchronous)throw failure;return Promise.reject(failure);});
  const checked=assert.rejects(pending,error=>error===failure);
  t.mock.timers.tick(RESULT_TRANSITION_MS);await checked;assert.equal(calls,1);
 }
});
