// Revision 2 creates fresh IDs and retargets only future introductory attempts.
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const historical=spawnSync(process.execPath,['scripts/build-intro-quiz-v1.mjs','--check'],{encoding:'utf8'});
assert.equal(historical.status,0,'A migration histórica deve permanecer idêntica ao arquivo arquivado.');
const old=JSON.parse(readFileSync('content/quiz-inicial-v1.json','utf8'));
const catalog=JSON.parse(readFileSync('content/quiz-inicial.json','utf8'));
assert.equal(catalog.schema,1);assert.equal(catalog.revision,2);assert.equal(catalog.questions.length,10);
assert.equal(new Set(catalog.questions.map(q=>q.id)).size,10);
for(const subject of ['matematica','portugues','ciencias','historia','geografia']) {
 const group=catalog.questions.filter(q=>q.subject===subject);assert.equal(group.length,2);
 assert.deepEqual(group.map(q=>q.difficulty).sort(),['easy','medium']);
}
const quote=value=>"'"+value.replaceAll("'","''")+"'";
const rows=catalog.questions.map((q,index)=>{
 assert.match(q.id,/^aa530000-0000-4000-8000-\d{12}$/);assert.equal(q.position,index+1);
 assert.equal(q.options.length,5);assert.equal(new Set(q.options).size,5);assert.match(q.correctAnswer,/^[A-E]$/);
 assert.equal(q.targetExam,['matematica','portugues'].includes(q.subject)?'both':'etec');
 for(const text of [q.topic,q.statement,...q.options,q.explanation])assert.ok(typeof text==='string'&&text.trim());
 return `(${q.position},${quote(q.id)},${quote(q.subject)},${quote(q.topic)},${quote(q.difficulty)},${quote(q.targetExam)},${quote(q.statement)},${quote(JSON.stringify(q.options))}::jsonb,${quote(q.correctAnswer)},${quote(q.explanation)})`;
}).join(',\n');
const prior=old.questions.map(q=>`(${q.position},${quote(q.id)}::uuid)`).join(',');
const sql=`begin;
-- Retire the former introductory catalog without editing its questions or snapshots.
create temporary table intro_previous(position smallint,id uuid) on commit drop;
insert into intro_previous values ${prior};
lock table private.intro_quiz_catalog in share row exclusive mode;
do $$begin
 if (select count(*) from private.intro_quiz_catalog)<>10 or exists(
 select 1 from intro_previous p full join private.intro_quiz_catalog c on c.position=p.position
 where c.question_id is distinct from p.id) then raise exception 'intro_catalog_conflict';end if;
end$$;
create temporary table intro_content_v2(position smallint,id uuid,subject text,topic text,difficulty text,target_exam text,statement text,options jsonb,correct_answer text,explanation text) on commit drop;
insert into intro_content_v2 values
${rows};
insert into public.questions(id,subject,topic,difficulty,target_exam,statement,option_a,option_b,option_c,option_d,option_e,status,version)
select id,subject,topic,difficulty,target_exam,statement,options->>0,options->>1,options->>2,options->>3,options->>4,'reviewed',1 from intro_content_v2;
insert into public.question_answers(question_id,correct_answer,explanation) select id,correct_answer,explanation from intro_content_v2;
update private.intro_quiz_catalog c set question_id=n.id from intro_content_v2 n where n.position=c.position;

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
 where q.status='reviewed' and q.difficulty in('easy','medium') order by c.position;
 get diagnostics inserted_count=row_count;
 if inserted_count<>10 or (select count(distinct subject) from private.guest_quiz_questions where attempt_id=attempt_uuid)<>5
 or exists(select 1 from private.guest_quiz_questions where attempt_id=attempt_uuid group by subject having count(*)<>2) then
  raise exception 'quiz_not_ready' using errcode='P0001';
 end if;
 return public.read_guest_quiz(p_token_hash);
end;
$$;
revoke all on function public.start_guest_quiz(text) from public,anon,authenticated,service_role;
grant execute on function public.start_guest_quiz(text) to service_role;
commit;
`;
const file='supabase/migrations/20261015020000_intro_quiz_contextualized.sql';
if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8'),sql);else writeFileSync(file,sql);
console.log('Quiz inicial: cinco fáceis e cinco intermediárias; migrations histórica e atual conferidas.');
