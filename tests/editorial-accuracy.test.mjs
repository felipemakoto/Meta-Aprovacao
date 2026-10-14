import test from 'node:test';
import assert from 'node:assert/strict';
import {loadCatalog} from '../scripts/lib/editorial-content.mjs';
import {number} from '../scripts/content/bank-utils.mjs';
const catalog=loadCatalog();
const answer=(family,variant)=>{
 const q=catalog.questions.find(q=>q.family===family&&q.variant===variant);
 assert.ok(q, family);
 return q.options['ABCDE'.indexOf(q.correctAnswer)];
};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);

test('24 novas tarefas matemáticas satisfazem equações independentes e cobrem todos os novos tipos',()=>{
 const rows=catalog.questions.filter(q=>q.audit?.kind==='inverse45');
 assert.equal(rows.length,24);
 for(const q of rows){const a=q.audit,r=a.result;
  assert.ok(answer(q.family,q.variant).startsWith(number(r)));
  switch(a.test){
   case 'reserve':near((a.total-r)/3,a.rest);break;
   case 'originalPrice':near(r*1.2*0.8,a.final);break;
   case 'discountRate':near(a.table*(1-r/100),a.paid);break;
   case 'workers':near(r*a.days*a.hours,a.work);break;
   case 'budget':assert.ok(a.fixed+a.rate*r<=a.budget);assert.ok(a.fixed+a.rate*(r+1)>a.budget);break;
   case 'ticketRevenue':near(r,a.countFull*a.full+(a.total-a.countFull)*a.reduced);break;
   case 'combinedAverage':near(r*(a.old+a.added),a.old*a.mean+a.added*a.score);break;
   case 'attendance':near(r,a.n1*a.p1/100+a.n2*a.p2/100);break;
   case 'conditional':{
    let red=0,total=0;
    for(let i=0;i<a.red+a.blue;i++)for(let j=0;j<a.red+a.blue;j++)if(i!==j&&i<a.red){total++;if(j<a.red)red++;}
    near(r/100,red/total);break;
   }
   case 'intersection':near(a.a+a.b-r+a.neither,a.total);break;
   case 'detour':near(a.cm*a.scale/100000*(1+r/100),a.path);break;
   case 'borderCost':near(r/a.price+(a.length-2*a.path)*(a.width-2*a.path),a.length*a.width);break;
   case 'rampPieces':near((r*a.piece/2)**2,a.rise**2+a.run**2);break;
   case 'towerShadow':near(a.height/r,a.smallHeight/a.smallShadow);break;
   case 'refill':near(r+a.current,a.capacity*a.fraction);break;
   case 'travelTime':near(r/60,a.distance/a.v1+a.distance/a.v2);break;
   case 'externalAngle':near(r*a.turn,360);break;
   case 'roles':{
    let choices=0;for(let i=0;i<a.n;i++)for(let j=0;j<a.n;j++)if(i!==j)choices++;
    assert.equal(r,choices);break;
   }
   case 'sequenceDay':near(a.first+(r-1)*a.growth,a.target);break;
   case 'sensorMean':near(r*(a.count+a.added),a.count*a.mean+a.added*a.score);break;
   case 'equalTimes':near(r*(a.t1+a.t2),a.v1*a.t1+a.v2*a.t2);break;
   case 'withStop':near((a.d1+a.d2)/r,a.d1/a.v1+a.d2/a.v2+a.stop);break;
   case 'doubling':near(r,Array.from({length:a.days},(_,i)=>a.first*a.ratio**i).reduce((a,b)=>a+b));break;
   case 'sequenceFirst':near(a.total,Array.from({length:a.days},(_,i)=>r+i*a.growth).reduce((a,b)=>a+b));break;
   default:assert.fail('Sem oráculo: '+q.label);
  }
 }
 const math=catalog.questions.filter(q=>q.subject==='matematica');
 assert.equal(math.filter(q=>q.audit.kind==='concept45').length,20);
 assert.equal(math.filter(q=>!['concept45','inverse45','workStages46','workRate46'].includes(q.audit.kind)).length,54);
 assert.equal(math.filter(q=>['workStages46','workRate46'].includes(q.audit.kind)).length,2);
});

test('distratores numéricos respeitam contagens inteiras, escala de notas e capacidade',()=>{
 const value=s=>Number(s.match(/^[\d.,]+/)[0].replaceAll('.','').replace(',','.'));
 for(const q of catalog.questions.filter(q=>q.subject==='matematica')){
  if(q.audit.kind==='tickets')for(const s of q.options){const v=value(s);assert.ok(Number.isInteger(v)&&v>=0&&v<=q.audit.total,q.label);}
  if(q.family==='M7'&&q.audit.kind!=='concept45')for(const s of q.options)assert.ok(value(s)>=0&&value(s)<=10,q.label);
  if(q.audit.kind==='sets')for(const s of q.options)assert.ok(Number.isInteger(value(s))&&value(s)>=0&&value(s)<=q.audit.total,q.label);
  if(q.audit.kind==='volume'){const a=q.audit,capacity=a.length*a.width*a.height/1000;for(const s of q.options)assert.ok(value(s)>=0&&value(s)<=capacity,q.label);}
  if(q.audit.test==='ticketRevenue')for(const s of q.options)assert.ok(value(s)>=q.audit.total*q.audit.reduced&&value(s)<=q.audit.total*q.audit.full,q.label);
 }
});

test('C02 distingue técnica planejada, divisão homogênea e recuperação efetiva',()=>{
 const solid=20,salt=30,water=150;
 assert.match(answer('C2',1),/Filtrar.*destilar/);
 const planning=catalog.questions.find(q=>q.family==='C2'&&q.variant===1);
 assert.ok(!planning.statement.includes('dividido'));
 assert.equal(answer('C2',2),number(salt/2)+' g');
 assert.equal(answer('C2',3),number(water/2)+' g');
 assert.match(answer('C2',4),/Arraste de gotículas/);
 assert.equal(answer('C2',5),number(solid+salt+water/2)+' g');
 assert.equal(solid+salt+water-(solid+salt+water/2),75);
 const completed=catalog.questions.find(q=>q.family==='C2'&&q.variant===5);
 assert.match(completed.statement,/liberando sua água para o ambiente/);
});

// Dados de cada cenário transcritos para relações independentes do gerador.
export const numericChecks=[
 ['C1',2,240/1,' cm³'], ['C2',2,30/2,' g'], ['C2',3,150/2,' g'], ['C2',5,20+30+150/2,' g'],
 ['C3',2,600*.7*10*60,' J'], ['C3',3,600*.3*10*60,' J'],
 ['C4',2,12/2,' V'], ['C4',3,12*(12/(1/(1/6+1/6))),' W'],
 ['C5',1,(200*60+400*15)/600,' °C'], ['C5',2,(60+15)/2,' °C'], ['C5',3,200*(60-45)/(45-15),' g'],
 ['C7',1,80000*.1**3,' kJ'], ['C7',4,40000*.1**3,' kJ'],
 ['C8',1,.5*.5*100,'%'], ['C8',3,(.5*.5)**2*100,'%'],
 ['C9',2,100000*.99*.01,''], ['C9',3,Math.round((100000*.01*.9)/(100000*.99*.01+100000*.01*.9)*1000)/10,'%'],
 ['C11',1,12/.6,' g/L'], ['C11',2,12*150/600,' g'], ['C11',4,20*.15/.3,' g/L'],
 ['C12',3,28-.5,' g'], ['C13',2,600/5000,' m²'], ['C13',3,1200/.06,' Pa'],
 ['C14',2,1/5,' s'], ['C14',5,20/10,' m'], ['C15',2,14-10,' horas'],
 ['C16',2,Math.round((21-18)/21*1000)/10,'% da concentração inicial.','Aproximadamente '],
 ['C17',2,(8-2)/8*100,'%'], ['C18',2,(320-200)/200*100,'%'],
 ['G1',1,8*50000/100000,' km'], ['G1',2,(2*50000/100000)**2,' km²'], ['G1',3,4*100000/25000,' cm'],
 ['G2',2,600000*.8/(3000*.2),' hab/km²'], ['G2',3,(600000+400000)/(3000+1000),' hab/km²'], ['G2',5,600000*.2/(3000*.8),' hab./km²'],
 ['G3',3,Math.round((85000-60000)/60000*1000)/10,'%.','Aproximadamente '],
 ['G5',1,Math.round((30000+10000)/60000*1000)/10,' por 100 pessoas de 15–64 anos.'],
 ['G5',4,Math.round((30000+20000)/60000*1000)/10,' por 100 pessoas de 15–64 anos.'],
 ['G4',1,50000+900-400+1500-2000,' habitantes'], ['G4',3,(900-400)/50000*1000,' por mil'],
 ['G6',2,15000/3000,' t/ha'], ['G6',3,(15000/3000-12000/3000)/(12000/3000)*100,'%'], ['G6',4,15000/(12000/3000),' hectares'],
 ['G7',1,(600-450)/600*100,'% da área florestal inicial.'],
 ['G8',2,(100*.2+100*.35)*10,' MWh'], ['G8',3,Math.round(20/(20+35)*1000)/10,'%'],
 ['G9',2,(120+80)/(60+20),' toneladas por habitante.'], ['G9',3,80*.75/20,' toneladas por habitante.'], ['G9',5,120*.9/60,' t/habitante'],
 ['G10',2,12000/(400*(.3-.15)),' km'], ['G11',1,50+30-20-45,' milhões de reais.'], ['G11',3,50+30*1.5-20-45,' milhões de reais.'],
 ['G12',2,[1000,1200,1500,2000,9300][2],'', 'R$ '], ['G12',3,9300/(1000+1200+1500+2000+9300)*100,'%'],
 ['G13',2,40+50-100,' mm'], ['G13',4,-60-20,' mm'], ['G14',1,100+10-40-50,' unidades'], ['G14',2,100+10-40-50-30,' unidades'],
 ['G16',3,8+2+4,' horas'], ['G16',4,24-22+20-(5-(-3)),' horas'],
 ['G17',2,20+20,'°'], ['G18',1,3000/(12000+3000)*100,'%'], ['G18',5,3000-(12000+3000)*.1,' pessoas'],
 ['G19',1,(600*20+400*50)/(600+400),' minutos'], ['G19',2,(600*20+400*35)/(600+400),' minutos'], ['G19',3,400*(50-35),' minutos'],
 ['G20',1,200/(100+200+700)*100,'%'], ['G20',3,200*1.1,'','R$ '], ['G20',5,Math.round(250/(100+250+700)*1000)/10,'%.','Aproximadamente '],
 ['H9',5,450/5,' g'],
];
test('70 resultados científicos, geográficos e históricos são recalculados independentemente',()=>{
 assert.equal(numericChecks.length,70);
 for(const [family,variant,result,suffix,prefix=''] of numericChecks){
  let expected=prefix+number(result)+suffix;
  if(result<0)expected=expected.replace('-','−');
  if(family==='G11'||(family==='G14'&&result>0))expected='+'+expected;

  assert.equal(answer(family,variant),expected,family+':'+variant);
 }
});

test('proporções condicionadas, balanços, temperaturas e fusos não extrapolam os dados',()=>{
 assert.equal(answer('C8',2),'2/3');
 assert.equal(answer('C6',4),'2 para 1');
 assert.equal(answer('C1',3),'480 g e flutuação');
 assert.equal(answer('C4',1),'1 A no circuito I e 4 A no circuito II.');
 assert.equal(answer('C13',1),'20.000 Pa em I e 10.000 Pa em II.');
 assert.equal(answer('C14',1),'4 m no I e 2 m no II.');
 assert.equal(answer('C14',3),'Passa de 5 para 10 comprimentos de onda.');
 assert.equal(answer('C12',2),'30 g em ambos os momentos');
 const loss=5+25-27.5,maximumCo2=5/84*44;
 assert.ok(loss<=maximumCo2, 'A perda de CO₂ deve caber na quantidade de bicarbonato.');
 assert.equal(answer('G1',5),'1:30.000');
 assert.equal(60000/Math.sqrt(4),30000);
 const departureUtc=22+3,firstArrivalUtc=departureUtc+8,finalUtc=firstArrivalUtc+2+4;
 assert.equal((firstArrivalUtc+1)%24,10);
 assert.equal((finalUtc+5)%24,20);
 assert.equal((finalUtc+5+3)%24,23);
 assert.equal(answer('G16',1),'10h de terça-feira.');
 assert.equal(answer('G16',2),'20h de terça-feira.');
 assert.equal(answer('G16',5),'23h de terça-feira.');
});

test('revisão de dificuldade cobre as 500 tarefas, com fundamento e sem aprovação humana presumida',()=>{
 for(const q of catalog.questions){
  assert.ok(['easy','medium','hard'].includes(q.difficulty));
  assert.ok(q.difficultyReview.skill.trim());
  assert.match(q.difficultyReview.method,/sem dados de desempenho/);
  assert.ok(['2026-10-13','2026-10-14'].includes(q.difficultyReview.reviewedOn));
  assert.equal(q.status,'published');
 }
 for(const q of catalog.questions.filter(q=>q.family==='M16'))assert.equal(new Set(q.options).size,5);
 assert.notEqual(answer('G2',2),answer('G2',5));
 assert.notEqual(answer('G1',2),answer('G1',5));
 assert.notEqual(answer('C11',2),answer('C11',4));
 assert.equal(answer('P15',2),'Assistir ao documentário e assistir o pesquisador.');
 assert.match(answer('P16',2),/ao diretor/);
 assert.match(answer('H15',5),/prerrogativas de intervenção/);
});
