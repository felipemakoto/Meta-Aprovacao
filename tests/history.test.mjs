import test from 'node:test';
import assert from 'node:assert/strict';
import {historyQuery,parseHistory,parsePracticeReview} from '../src/lib/quiz/history-contract.ts';
import {historyHandler} from '../src/lib/quiz/history-http.ts';
const id=i=>'00000000-0000-4000-8000-'+String(i).padStart(12,'0');
const at='2026-09-30T15:00:00.123456+00:00';
const item={id:id(20),at,score:7,total:10};
test('cursor preserva microssegundos e query recusa campos forjados/duplicados',()=>{
 assert.deepEqual(historyQuery(new URL('http://local/api/history?kind=tests&before='+encodeURIComponent(at)+'&beforeId='+id(20))),{kind:'tests',before:{at,id:id(20)}});
 for(const q of ['','kind=all','kind=tests&kind=practice','kind=tests&user_id=x','kind=tests&before=invalid&beforeId='+id(20),'kind=tests&beforeId='+id(20),'kind=tests&before='+at])assert.throws(()=>historyQuery(new URL('http://local/?'+q)));
});
test('lista allowlist sem gabarito e sem dados privados; prática não é teste',()=>{
 assert.deepEqual(parseHistory({items:[{...item,correctAnswer:'B',user:'secret'}],next:null,private:'x'},'tests'),{items:[item],next:null});
 const p={id:id(21),at,subject:'matematica',topic:'Porcentagem',correct:false};
 assert.deepEqual(parseHistory({items:[{...p,explanation:'secret',statement:'s'}],next:null},'practice'),{items:[p],next:null});
 assert.throws(()=>parseHistory({items:[p],next:null},'tests'));
});
test('página inválida não vira histórico vazio e cursor exige último item',()=>{
 for(const v of [null,{}, {items:[{...item,score:11}],next:null},{items:[item,item],next:null},{items:Array(21).fill(item),next:null},{items:[],next:item},{items:[item],next:{id:id(1),at}}])assert.throws(()=>parseHistory(v,'tests'));
 const items=Array.from({length:20},(_,i)=>({...item,id:id(21-i)}));
 assert.equal(parseHistory({items,next:{at,id:id(2)}},'tests').next.id,id(2));
});
test('revisão validada retira campos privados e confere alternativa/correção',()=>{
 const q={id:id(1),at,subject:'matematica',topic:'P',statement:'S',options:['1','2','3','4','5'],answer:'A',correctAnswer:'B',correct:false,explanation:'E'};
 assert.deepEqual(parsePracticeReview({...q,user:'private',snapshot:'private'}),q);
 for(const bad of [{...q,correct:true},{...q,answer:'F'},{...q,options:['1']},{...q,explanation:''}])assert.throws(()=>parsePracticeReview(bad));
});
test('HTTP não consulta banco sem sessão; identidade vem do servidor e resposta não cacheia',async()=>{
 let calls=0;
 const unauth=historyHandler({user:async()=>null,read:async()=>{calls++;}});
 const req=new Request('http://local/api/history?kind=tests');
 assert.equal((await unauth(req)).status,401);assert.equal(calls,0);
 const h=historyHandler({user:async()=>'verified',read:async(u,k,b)=>{assert.equal(u,'verified');assert.equal(k,'tests');assert.equal(b,null);return {items:[item],next:null};}});
 const r=await h(req);assert.equal(r.status,200);assert.match(r.headers.get('cache-control'),/private, no-store/);assert.deepEqual(await r.json(),{items:[item],next:null});
 assert.equal((await h(new Request('http://local/api/history?kind=tests&user_id=forged'))).status,400);
});
test('erro do banco e dados incoerentes retornam erro genérico sem vazamento',async()=>{
 for(const read of [async()=>{throw new Error('secret');},async()=>({items:'broken'})]){
 const r=await historyHandler({user:async()=>'verified',read})(new Request('http://local/?kind=practice'));
 assert.equal(r.status,503);assert.deepEqual(await r.json(),{error:'history_unavailable'});
 }
});

