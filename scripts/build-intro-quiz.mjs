// Curated easy introduction; not part of the published ETEC/IFSP practice bank.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const catalog=JSON.parse(readFileSync('content/quiz-inicial.json','utf8'));
assert.equal(catalog.schema,1);assert.equal(catalog.questions.length,10);
assert.equal(new Set(catalog.questions.map(q=>q.id)).size,10);
for(const subject of ['matematica','portugues','ciencias','historia','geografia'])assert.equal(catalog.questions.filter(q=>q.subject===subject).length,2);
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const rows=catalog.questions.map((q,index)=>{
 assert.match(q.id,/^aa520000-0000-4000-8000-\d{12}$/);assert.equal(q.position,index+1);
 assert.equal(q.options.length,5);assert.equal(new Set(q.options).size,5);assert.match(q.correctAnswer,/^[A-E]$/);
 for(const text of [q.topic,q.statement,...q.options,q.explanation])assert.ok(typeof text==='string'&&text.trim());
 return `(${q.position},${quote(q.id)},${quote(q.subject)},${quote(q.topic)},${quote(q.statement)},${quote(JSON.stringify(q.options))}::jsonb,${quote(q.correctAnswer)},${quote(q.explanation)})`;
}).join(',\n');
const sql=`-- Ten fixed introductory questions. Reviewed by AI under the owner's editorial policy.
-- Status reviewed keeps them OUT of published practice/simulations; only this catalog exposes them.
create table private.intro_quiz_catalog (
 position smallint primary key check(position between 1 and 10),
 question_id uuid not null unique references public.questions(id) on delete restrict
);
alter table private.intro_quiz_catalog enable row level security;
revoke all on private.intro_quiz_catalog from public,anon,authenticated,service_role;
create temporary table intro_content(position smallint,id uuid,subject text,topic text,statement text,options jsonb,correct_answer text,explanation text) on commit drop;
insert into intro_content values
${rows};
insert into public.questions(id,subject,topic,statement,option_a,option_b,option_c,option_d,option_e,difficulty,target_exam,status,version)
select id,subject,topic,statement,options->>0,options->>1,options->>2,options->>3,options->>4,'easy','both','reviewed',1 from intro_content;
insert into public.question_answers(question_id,correct_answer,explanation) select id,correct_answer,explanation from intro_content;
insert into private.intro_quiz_catalog(position,question_id) select position,id from intro_content;
comment on table private.intro_quiz_catalog is 'Fixed introductory quiz only. Reviewed questions are not eligible for published practice or simulations. Server snapshot and answer separation preserved.';

create or replace function public.start_guest_quiz(p_token_hash text)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare attempt_uuid uuid; inserted_count integer;
begin
 if p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_token_hash' using errcode='22023';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_token_hash,0));
 if exists(select 1 from public.guest_quiz_attempts where token_hash=p_token_hash) then return public.read_guest_quiz(p_token_hash);end if;
 insert into public.guest_quiz_attempts(token_hash) values(p_token_hash) returning id into attempt_uuid;
 insert into private.guest_quiz_questions(attempt_id,position,question_id,question_version,subject,topic,statement,options,correct_answer,explanation)
 select attempt_uuid,c.position,q.id,q.version,q.subject,q.topic,q.statement,
 jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),a.correct_answer,a.explanation
 from private.intro_quiz_catalog c join public.questions q on q.id=c.question_id
 join public.question_answers a on a.question_id=q.id
 where q.status='reviewed' and q.difficulty='easy' order by c.position;
 get diagnostics inserted_count=row_count;
 if inserted_count<>10 or (select count(distinct subject) from private.guest_quiz_questions where attempt_id=attempt_uuid)<>5 then
  raise exception 'quiz_not_ready' using errcode='P0001';
 end if;
 return public.read_guest_quiz(p_token_hash);
end;
$$;
revoke all on function public.start_guest_quiz(text) from public,anon,authenticated,service_role;
grant execute on function public.start_guest_quiz(text) to service_role;
`;
const file='supabase/migrations/20261015010000_intro_quiz_catalog.sql';
if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8'),sql);else writeFileSync(file,sql);
console.log('Quiz inicial: dez questões fáceis; migration '+(process.argv.includes('--check')?'conferida.':'gerada.'));
