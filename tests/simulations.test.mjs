import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCatalog,parseSimulationInput,parseSimulationState,parseSimulationResult} from '../src/lib/quiz/simulation-contract.ts';
import {simulationHandlers} from '../src/lib/quiz/simulation-http.ts';
import {historyQuery,parseHistory} from '../src/lib/quiz/history-contract.ts';
import {toPublicQuiz} from '../src/lib/quiz/contract.ts';
import {toQuizResult} from '../src/lib/quiz/result-contract.ts';
const id=i=>'00000000-0000-4000-8000-'+String(i).padStart(12,'0');
const questions=Array.from({length:20},(_,i)=>({id:id(i+1),position:i+1,version:1,subject:'matematica',topic:'P',statement:'S',options:['1','2','3','4','5'],correctAnswer:'B',explanation:'E'}));
const quiz={id:id(30),title:'Matemática',startedAt:'2026-09-30T12:00:00Z',expiresAt:'2026-10-01T12:00:00Z',questionCount:20,questions};
const result={id:id(30),title:'Matemática',completedAt:'2026-09-30T12:01:00Z',durationSeconds:60,total:20,score:20,questions:questions.map(q=>({...q,answer:'B',correct:true}))};
const answers=questions.map(q=>({questionId:q.id,answer:'B'}));
test('contratos permitem 20 questões, preservam contratos de teste com 10 e removem gabarito da tentativa',()=>{
 const safe=parseSimulationState({quiz});assert.equal(safe.quiz.questionCount,20);assert.ok(!JSON.stringify(safe).includes('correctAnswer'));assert.ok(!JSON.stringify(safe).includes('explanation'));
 assert.throws(()=>toPublicQuiz(quiz));assert.throws(()=>toQuizResult(result));assert.equal(parseSimulationResult(result).score,20);
 for(const bad of [{...quiz,questions:[...questions.slice(1),questions[1]]},{...quiz,questionCount:101},{...quiz,expiresAt:quiz.startedAt}])assert.throws(()=>parseSimulationState({quiz:bad}));
 for(const bad of [{...result,score:19},{...result,durationSeconds:-1},{...result,total:10}])assert.throws(()=>parseSimulationResult(bad));
});
test('catálogo e envio recusam IDs forjados, extras, duplicação e respostas fora das alternativas',()=>{
 assert.deepEqual(parseCatalog([{id:id(31),title:'Matemática',count:20,subject:'matematica',secret:'x'}]),[{id:id(31),title:'Matemática',count:20,subject:'matematica'}]);
 assert.equal(parseSimulationInput({action:'submit',id:id(30),answers}).answers.length,20);
 for(const v of [{action:'start',id:id(30),user_id:id(1)},{action:'submit',id:id(30),answers:answers.map(a=>({...a,answer:'F'}))},{action:'submit',id:id(30),answers:[...answers.slice(1),answers[1]]}])assert.throws(()=>parseSimulationInput(v));
});
const req=(body,origin='http://localhost:3000')=>new Request('http://localhost:3000/api/simulations',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
test('HTTP valida origem e sessão antes da operação, usa identidade verificada e limita payload',async()=>{
 let calls=0;const deps={user:async()=>null,catalog:async()=>{calls++;return[];},read:async()=>{calls++;},run:async()=>{calls++;}};
 const h=simulationHandlers(deps,{secure:false});
 assert.equal((await h.GET(new Request('http://localhost:3000/api/simulations'))).status,401);
 assert.equal((await h.POST(req({action:'start',id:id(31)}))).status,401);
 assert.equal((await h.POST(req({action:'start',id:id(31)},'http://evil.local'))).status,403);assert.equal(calls,0);
 const verified=simulationHandlers({...deps,user:async()=>'verified',run:async(u,input)=>{assert.equal(u,'verified');assert.equal(input.id,id(31));return {quiz};}},{secure:false});
 const r=await verified.POST(req({action:'start',id:id(31)}));assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/private, no-store/);assert.ok(!JSON.stringify(await r.json()).includes('correctAnswer'));
 assert.equal((await verified.POST(req({action:'start',id:id(31),user:'forged'}))).status,400);
 assert.equal((await verified.POST(req({x:'a'.repeat(16001)}))).status,413);
 assert.equal((await verified.GET(new Request('http://localhost:3000/api/simulations?id='+id(1)+'&id='+id(2)))).status,400);
 const production=simulationHandlers(deps,{secure:true});assert.equal((await production.POST(req({action:'start',id:id(31)}))).status,403);
});
test('HTTP não confunde erro com vazio, não vaza mensagens internas e mantém conflitos',async()=>{
 const make=run=>simulationHandlers({user:async()=>'verified',catalog:async()=>[],read:async()=>null,run},{secure:false});
 for(const [msg,status,expected] of [['database secret',503,'simulation_unavailable'],['already_submitted',409,'already_submitted'],['rate_limited',429,'rate_limited']]){const r=await make(async()=>{throw Error(msg);}).POST(req({action:'start',id:id(31)}));assert.equal(r.status,status);assert.deepEqual(await r.json(),{error:expected});}
 const h=make(async()=>({result}));assert.deepEqual(await (await h.GET(new Request('http://localhost:3000/api/simulations'))).json(),{items:[]});assert.equal((await h.GET(new Request('http://localhost:3000/api/simulations?id='+id(30)))).status,404);
});
test('histórico de simulados aceita total variável e só lista metadados',()=>{
 assert.equal(historyQuery(new URL('http://local/?kind=simulations')).kind,'simulations');
 const item={id:id(30),at:result.completedAt,title:'Matemática',durationSeconds:60,total:20,score:20};
 assert.deepEqual(parseHistory({items:[{...item,questions,correctAnswer:'B'}],next:null},'simulations'),{items:[item],next:null});
 assert.throws(()=>parseHistory({items:[{...item,score:21}],next:null},'simulations'));
});
