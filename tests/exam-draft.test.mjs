import test from 'node:test';
import assert from 'node:assert/strict';
import {createExamDraftSaver} from '../src/lib/premium-study/exam-draft.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('resposta é enviada imediatamente; edições rápidas aguardam e preservam o último estado',async()=>{
 const sent=[],release=[],status=[];
 const saver=createExamDraftSaver(7,draft=>{sent.push(draft);return new Promise(resolve=>release.push(resolve));},s=>status.push(s.state));
 const first={answers:{a:'B'},marked:[]};saver.save(first);
 assert.equal(sent.length,1);assert.deepEqual(sent[0],{answers:{a:'B'},marked:[],revision:8});assert.equal(saver.pending,true);
 first.answers.a='C';saver.save({answers:{a:'D'},marked:['a']});saver.save({answers:{a:'E',b:'A'},marked:[]});
 assert.equal(sent.length,1);release.shift()();await tick();
 assert.deepEqual(sent[1],{answers:{a:'E',b:'A'},marked:[],revision:9});assert.equal(saver.pending,true);
 release.shift()();await tick();assert.equal(saver.pending,false);assert.equal(status.at(-1),'saved');
});
test('falha mantém rascunho pendente para nova tentativa e remoções também são salvas',async()=>{
 let fail=true;const sent=[],status=[];
 const saver=createExamDraftSaver(0,async draft=>{sent.push(draft);if(fail)throw Error('Conexão indisponível');},s=>status.push(s));
 saver.save({answers:{a:'B'},marked:['a']});await tick();assert.equal(saver.pending,true);assert.equal(status.at(-1).state,'error');
 fail=false;saver.retry();await tick();assert.equal(saver.pending,false);assert.equal(sent[1].revision,2);
 saver.save({answers:{},marked:[]});await tick();assert.deepEqual(sent.at(-1).answers,{});assert.deepEqual(sent.at(-1).marked,[]);assert.equal(saver.pending,false);
});
test('conflito com outra aba bloqueia tentativas posteriores sem sobrescrever dados',async()=>{
 let calls=0;const saver=createExamDraftSaver(4,async()=>{calls++;throw Error('O rascunho mudou em outra aba.');},()=>{});
 saver.save({answers:{a:'B'},marked:[]});await tick();saver.retry();saver.save({answers:{a:'C'},marked:[]});await tick();assert.equal(calls,1);assert.equal(saver.pending,true);
});
