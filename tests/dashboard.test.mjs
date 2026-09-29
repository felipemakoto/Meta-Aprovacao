import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDashboard, loadDashboard } from '../src/lib/quiz/dashboard-contract.ts';
const latest={id:'00000000-0000-4000-8000-000000000018',completedAt:'2026-09-29T12:00:00Z',score:7,total:10};
test('contrato aceita agregado real e remove campos privados',()=>{
 assert.deepEqual(parseDashboard({answered:20,correct:17,latest:{...latest,secret:'x'},private:'x'}),{answered:20,correct:17,latest});
 assert.deepEqual(parseDashboard({answered:0,correct:0,latest:null}),{answered:0,correct:0,latest:null});
});
test('dados inválidos não viram zero nem nota falsa',()=>{
 for(const value of [null,{}, {answered:10,correct:7,latest:null}, {answered:0,correct:0,latest},
  {answered:10,correct:8,latest}, {answered:10,correct:-1,latest}, {answered:10,correct:6,latest},
  {answered:20,correct:21,latest}, {answered:10,correct:7,latest:{...latest,completedAt:'invalid'}},
  {answered:10,correct:7,latest:{...latest,score:7.5}}, {answered:10,correct:7,latest:{...latest,total:12}}]) assert.throws(()=>parseDashboard(value));
});
test('sessão ausente não acessa banco; identidade vem da verificação',async()=>{
 assert.deepEqual(await loadDashboard({user:async()=>null,read:async()=>assert.fail('read')}),{kind:'login'});
 let id; const state=await loadDashboard({user:async()=>'verified',read:async user=>{id=user;return {answered:10,correct:7,latest}}});
 assert.equal(id,'verified');assert.equal(state.kind,'ready');
});
test('falhas de autenticação, banco e contrato produzem erro distinto de vazio',async()=>{
 for(const deps of [ {user:async()=>{throw new Error('secret')},read:async()=>null},
  {user:async()=>'user',read:async()=>{throw new Error('secret')}}, {user:async()=>'user',read:async()=>null}])
  assert.deepEqual(await loadDashboard(deps),{kind:'error'});
});
