import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStudyCommand,parseWorkspace} from '../src/lib/premium-study/contract.ts';
import {diagnosis,generatePlan,calendarIcs,localStudyDate} from '../src/lib/premium-study/planning.ts';
import {studyHandlers} from '../src/lib/premium-study/http.ts';
import {officialUrl,verifyOfficialDocument} from '../src/lib/premium-study/documents.ts';
import {parseSimulationResult} from '../src/lib/quiz/simulation-contract.ts';
import {toQuizResult} from '../src/lib/quiz/result-contract.ts';
const id='10000000-0000-4000-8000-000000000001',other='10000000-0000-4000-8000-000000000002';
const profile={institution:'etec',examDate:'2027-01-10',weekdays:[1,2,3,4,5],minutes:60,startTime:'18:00',dailyGoal:20,weeklyGoal:81,reminder:15};
const workspace={asOf:'2026-10-21T12:00:00Z',days:30,groups:[],institutions:[{id:'etec',name:'ETEC',subjects:{matematica:10,portugues:10,ciencias:10,historia:10,geografia:10}}],officialEvents:[],profile,sessions:[],documents:[],reviewHistory:[],due:{review:1,flashcard:0},topics:[],exams:[]};
const config={mode:'custom',institution:'etec',subjects:['matematica'],topics:[],difficulty:'all',count:10,minutes:30};
const session={title:'Minha sessão',date:'2026-11-02',time:'18:00',minutes:30,subject:'matematica',topic:'',kind:'practice',goal:10,reminder:15,completed:false,archived:false};
const valid=[{action:'save_profile',profile},{action:'sync_plan'},{action:'save_session',id:null,requestId:id,session},{action:'start_exam',config,requestId:id},{action:'save_exam',id,answers:{[id]:'B'},marked:[id],revision:1},{action:'finish_exam',id,answers:[{questionId:id,answer:'-'}]},{action:'rate_card',questionId:id,mode:'review',rating:3,requestId:id},{action:'register_document',document:{institution:'etec',year:2026,selection:'1º semestre',examUrl:'https://fatweb.s3.amazonaws.com/vestibulinhoetec/a.pdf',answerUrl:'https://fatweb.s3.amazonaws.com/vestibulinhoetec/b.pdf',sourceUrl:'https://vestibulinho.etec.sp.gov.br/provas-gabaritos/'}}];
test('comandos exatos, sem identidade, autorização, pontuação ou configuração financeira do cliente',()=>{
 for(const command of valid){assert.deepEqual(parseStudyCommand(command),command);for(const key of ['userId','hasPremium','score','price'])assert.throws(()=>parseStudyCommand({...command,[key]:true}));}
 for(const command of [{action:'delete_user'},{...valid[0],profile:{...profile,examDate:'2026-02-30'}},{...valid[0],profile:{...profile,weekdays:[1,1]}},{...valid[0],profile:{...profile,startTime:'25:01'}},{...valid[0],profile:{...profile,minutes:0}},{...valid[3],config:{...config,count:101}},{...valid[4],answers:JSON.parse('{"__proto__":"B"}')},{...valid[4],marked:[id,id]},{...valid[5],answers:[{questionId:id,answer:'B',correct:true}]},{...valid[6],rating:5}])assert.throws(()=>parseStudyCommand(command));
});
test('diagnóstico e radar compartilham amostra distinta e não classificam amostras pequenas',()=>{
 const rows=diagnosis([{level:'topic',subject:'matematica',topic:'A',difficulty:'',n:2,correct:0},{level:'topic',subject:'matematica',topic:'B',difficulty:'',n:10,correct:2},{level:'subject',subject:'portugues',topic:'',difficulty:'',n:20,correct:18}]);
 assert.equal(rows.find(r=>r.topic==='A').state,'Amostra insuficiente');assert.equal(rows.find(r=>r.topic==='B').state,'Priorizar');assert.equal(rows.find(r=>r.subject==='portugues').state,'Bom desempenho');
 assert.throws(()=>parseWorkspace({...workspace,groups:[{level:'subject',subject:'matematica',topic:'',difficulty:'',n:2,correct:3}]}));
 assert.equal(parseWorkspace({...workspace,secret:'private'}).secret,undefined);
});
test('plano respeita disponibilidade, data, orçamento diário/semanal e não sobrepõe edição manual',()=>{
 const at=new Date('2026-10-21T12:00:00Z'),items=generatePlan(workspace,at),weekly=new Map(),daily=new Map();assert.ok(items.length>0&&items.length<=84);assert.deepEqual(generatePlan(workspace,at),items);
 for(const item of items){const d=new Date(item.date+'T12:00:00Z');assert.ok(profile.weekdays.includes(d.getUTCDay()));assert.ok(item.date<=profile.examDate);d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));const w=d.toISOString().slice(0,10);weekly.set(w,(weekly.get(w)??0)+item.goal);daily.set(item.date,(daily.get(item.date)??0)+item.minutes);}
 assert.ok([...weekly.values()].every(n=>n<=profile.weeklyGoal));assert.ok([...daily.values()].every(n=>n<=profile.minutes));
 const first=items[0],manual={id,title:'Manual',study_date:first.date,start_time:first.time,minutes:first.minutes,source:'manual',archived:false};
 assert.ok(!generatePlan({...workspace,sessions:[manual]},at).some(s=>s.date===first.date&&s.time===first.time));
 assert.deepEqual(generatePlan({...workspace,profile:null},at),[]);
});
test('exportação ICS escapa conteúdo e inclui alarme sem transmitir dados a terceiros',()=>{
 const ics=calendarIcs([{id,title:'Estudar, testar; seguro\nBEGIN:VEVENT',study_date:'2026-11-02',start_time:'18:00:00',minutes:30,topic:'Tema',archived:false,completed_at:null,reminder_minutes:15}],new Date('2026-10-21T12:00:00Z'));
 assert.match(ics,/DTSTART:20261102T210000Z/);assert.match(ics,/TRIGGER:-PT15M/);assert.match(ics,/Estudar\\, testar\\; seguro\\nBEGIN:VEVENT/);assert.equal((ics.match(/^BEGIN:VEVENT$/gm)??[]).length,1);assert.doesNotMatch(ics,/AUTHORIZATION|https:/);
});
const origin='https://study.example',fail=async()=>assert.fail('Operação não autorizada alcançou dados');
const request=(body,headers={})=>new Request(origin+'/api/premium/study',{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
const handlers=(deps={})=>studyHandlers({user:async()=>'verified-user',require:async()=>{},read:async()=>workspace,cards:async()=>[],calendar:async()=>'',execute:async()=>null,...deps},{secure:true,origin});
test('todas as ações e leituras exigem identidade verificada e Premium no backend',async()=>{
 for(const command of valid){assert.equal((await handlers({user:async()=>null,execute:fail}).POST(request(command))).status,401);assert.equal((await handlers({require:async()=>{throw Error('premium_required')},execute:fail}).POST(request(command))).status,403);}
 for(const path of ['', '?view=cards','?view=calendar']){assert.equal((await handlers({user:async()=>null,read:fail,cards:fail,calendar:fail}).GET(new Request(origin+'/api/premium/study'+path))).status,401);assert.equal((await handlers({require:async()=>{throw Error('premium_required')},read:fail,cards:fail,calendar:fail}).GET(new Request(origin+'/api/premium/study'+path))).status,403);}
 let received;const r=await handlers({execute:async(...args)=>{received=args;return {id}}}).POST(request(valid[2]));assert.equal(r.status,200);assert.deepEqual(received,['verified-user',valid[2]]);assert.match(r.headers.get('cache-control'),/private.*no-store/);
});
test('origem, parâmetros duplicados e entradas privadas são rejeitados; erro interno não vaza',async()=>{
 for(const headers of [{origin:'https://foreign.example'},{'sec-fetch-site':'cross-site'}])assert.equal((await handlers({execute:fail}).POST(request(valid[0],headers))).status,403);
 for(const query of ['?days=30&days=7','?userId='+other,'?view=cards&mode=admin','?view=cards&subject=unknown','?days=999'])assert.equal((await handlers({read:fail,cards:fail}).GET(new Request(origin+'/api/premium/study'+query))).status,400);
 const r=await handlers({execute:async()=>{throw Error('sb_secret_private')}}).POST(request(valid[1]));assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/sb_secret/);
});
test('fonte de PDF restringe hosts, credenciais e caminhos; exige vínculo editorial e bytes PDF',async()=>{
 for(const value of ['http://ifsp.edu.br/a','https://ifsp.edu.br.evil.invalid/a','https://127.0.0.1/a.pdf','https://user:pw@ifsp.edu.br/a','https://fatweb.s3.amazonaws.com/other-bucket/a.pdf','https://concurso30.fundacaocefetminas.org.br/admin/a.pdf'])assert.throws(()=>officialUrl(value,true));
 const d=valid[7].document,calls=[];
 const transport=async(url,opts)=>{calls.push({url,opts});assert.equal(opts.redirect,'error');return url===d.sourceUrl?new Response(`<a href="${d.examUrl}">Prova</a><a href="${d.answerUrl}">Gabarito</a>`,{headers:{'content-type':'text/html'}}):new Response('%PDF-1.7\n',{headers:{'content-type':'application/pdf'}});};
 await verifyOfficialDocument(d,transport);assert.equal(calls.length,3);
 await assert.rejects(()=>verifyOfficialDocument(d,async()=>new Response('<p>Sem links</p>',{headers:{'content-type':'text/html'}})),/source_links_missing/);
 await assert.rejects(()=>verifyOfficialDocument(d,async(url,opts)=>url===d.sourceUrl?transport(url,opts):new Response('not PDF',{headers:{'content-type':'application/pdf'}})),/invalid_document/);
});
test('questão em branco só é aceita na correção de simulado cronometrado, sem fabricar resposta',()=>{
 const result={id,completedAt:'2026-10-21T12:00:00Z',total:5,score:0,title:'Simulado Premium',durationSeconds:600,timed:true,questions:Array.from({length:5},(_,i)=>({id:id.slice(0,-1)+(i+1),position:i+1,subject:'matematica',topic:'Teste',statement:'Questão',options:['1','2','3','4','5'],answer:'-',correctAnswer:'B',correct:false,explanation:'Explicação'}))};
 assert.throws(()=>toQuizResult(result,5));assert.equal(parseSimulationResult(result).questions[0].answer,'-');assert.throws(()=>parseSimulationResult({...result,timed:false}));assert.throws(()=>parseSimulationResult({...result,score:5}));
});


test('metas diárias não são ultrapassadas pelo arredondamento das sessões',()=>{
 const w={...workspace,profile:{...profile,dailyGoal:17,weeklyGoal:700,minutes:90},due:{review:0,flashcard:0}};
 const plan=generatePlan(w,new Date(workspace.asOf)),days=new Map();
 for(const item of plan)days.set(item.date,(days.get(item.date)??0)+item.goal);
 assert.ok(days.size>0);for(const goal of days.values())assert.ok(goal<=17);
});


test('dia de estudo acompanha Brasília na virada da data UTC',()=>{
 assert.equal(localStudyDate(new Date('2026-10-22T01:30:00Z')),'2026-10-21');
 assert.equal(localStudyDate(new Date('2026-10-22T03:30:00Z')),'2026-10-22');
});
