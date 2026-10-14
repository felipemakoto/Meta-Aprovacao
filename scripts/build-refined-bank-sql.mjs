import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadCatalog,root} from './lib/editorial-content.mjs';
import {editorialProjection} from './lib/content-versions.mjs';
import {fingerprint,delta,projection} from './lib/editorial-patch.mjs';
const manifest=JSON.parse(readFileSync(new URL('content/revisao-etapa-46.json',root),'utf8'));
const catalog=loadCatalog();
assert.ok(manifest.changes.length>0);
assert.equal(manifest.additions.length,0);
assert.equal(manifest.catalogHash,catalog.catalogHash);
for(const c of manifest.changes){
 assert.deepEqual(c.after,editorialProjection(catalog.questions.find(q=>q.id===c.id)));
 assert.equal(c.before.status,'draft');assert.equal(c.after.status,'draft');
 assert.equal(c.before.subject,c.after.subject);
 assert.equal(c.after.version,c.before.version+1);
}
const compact=manifest.changes.map(c=>({id:c.id,label:c.label,beforeHash:fingerprint(c.before),afterHash:fingerprint(c.after),patch:delta(c)}));
const payload=JSON.stringify(compact);
assert.ok(!payload.includes('$stage46$'));
const sql=`-- Etapa 46: atualização dos rascunhos existentes, sem inserção ou publicação.
-- Dados repetidos foram omitidos do transporte. SHA-256 confere TODO o conteúdo
-- editorial antes/depois, inclusive os campos ausentes do delta.
do $stage46$
declare changes jsonb:='${payload.replaceAll("'","''")}'::jsonb; c jsonb; current_content jsonb; current_hash text;
begin
 perform pg_advisory_xact_lock(hashtextextended('editorial_catalog_stage46',46));
 perform 1 from public.questions where id in(select (value->>'id')::uuid from jsonb_array_elements(changes)) order by id for update;
 perform 1 from public.question_answers where question_id in(select (value->>'id')::uuid from jsonb_array_elements(changes)) order by question_id for update;
 for c in select value from jsonb_array_elements(changes) loop
  select ${projection} into current_content from public.questions q left join public.question_answers a on a.question_id=q.id where q.id=(c->>'id')::uuid;
  current_hash:=encode(sha256(convert_to(current_content::text,'UTF8')),'hex');
  if current_hash is null or (current_hash<>c->>'beforeHash' and current_hash<>c->>'afterHash') then raise exception 'stage46_content_diverged: %',c->>'label';end if;
  if current_hash<>c->>'afterHash' and (
   exists(select 1 from private.practice_attempts where question_id=(c->>'id')::uuid)
   or exists(select 1 from private.guest_quiz_questions where question_id=(c->>'id')::uuid)
   or exists(select 1 from private.simulation_attempts where snapshots @> jsonb_build_array(jsonb_build_object('id',c->>'id')))) then
   raise exception 'stage46_content_used: %',c->>'label';
  end if;
 end loop;
 for c in select value from jsonb_array_elements(changes) loop
  select ${projection} into current_content from public.questions q left join public.question_answers a on a.question_id=q.id where q.id=(c->>'id')::uuid;
  if encode(sha256(convert_to(current_content::text,'UTF8')),'hex')=c->>'afterHash' then continue;end if;
  update public.questions set statement=coalesce(c->'patch'->>'statement',statement),topic=coalesce(c->'patch'->>'topic',topic),difficulty=coalesce(c->'patch'->>'difficulty',difficulty),
   option_a=coalesce(c->'patch'->'options'->>0,option_a),option_b=coalesce(c->'patch'->'options'->>1,option_b),option_c=coalesce(c->'patch'->'options'->>2,option_c),
   option_d=coalesce(c->'patch'->'options'->>3,option_d),option_e=coalesce(c->'patch'->'options'->>4,option_e),
   target_exam=coalesce(c->'patch'->>'targetExam',target_exam),version=(c->'patch'->>'version')::int where id=(c->>'id')::uuid;
  update public.question_answers set correct_answer=coalesce(c->'patch'->>'correctAnswer',correct_answer),explanation=coalesce(c->'patch'->>'explanation',explanation) where question_id=(c->>'id')::uuid;
  select ${projection} into current_content from public.questions q left join public.question_answers a on a.question_id=q.id where q.id=(c->>'id')::uuid;
  if encode(sha256(convert_to(current_content::text,'UTF8')),'hex')<>c->>'afterHash' then raise exception 'stage46_after_mismatch: %',c->>'label';end if;
 end loop;
end $stage46$;
`;
assert.ok(process.argv.slice(2).every(arg=>arg==='--check'));
const file=new URL('supabase/content/revisao-etapa-46.sql',root);
if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8').replaceAll('\r\n','\n'),sql);
else writeFileSync(file,sql);
console.log(`Revisão atômica preparada: ${compact.length} deltas; nenhuma execução no banco.`);
