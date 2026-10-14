// Uma transação: catálogo conferido por IA + modelos, sem direitos pagos ou ACLs.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {loadCatalog,root} from './lib/editorial-content.mjs';
import {editorialProjection} from './lib/content-versions.mjs';
import {fingerprint,delta,projection} from './lib/editorial-patch.mjs';
const manifest=JSON.parse(readFileSync(new URL('content/revisao-etapa-47.json',root),'utf8'));
const catalog=loadCatalog();
assert.equal(manifest.catalogHash,catalog.catalogHash);
assert.equal(manifest.changes.length,500);assert.equal(manifest.additions.length,0);
assert.equal(manifest.models.length,6);
assert.equal(manifest.decision.humanReviewRequired,false);
assert.equal(manifest.decision.ownerInstruction,'não é necessária revisão humana, pode revisar uma ultima vez e continuar');
const core=['subject','topic','difficulty','statement','options','correctAnswer','explanation','targetExam'];
for(const c of manifest.changes){
 assert.deepEqual(c.after,editorialProjection(catalog.questions.find(q=>q.id===c.id)));
 assert.equal(c.before.status,'draft');assert.equal(c.after.status,'published');
 const changed=core.some(k=>JSON.stringify(c.before[k])!==JSON.stringify(c.after[k]));
 assert.equal(c.after.version,c.before.version+(changed?1:0));
}
for(const m of manifest.models){
 assert.equal(m.before.published,false);assert.equal(m.after.published,true);
 assert.deepEqual(m.after,{...m.before,published:true});
 assert.equal(m.after.question_count,m.after.subject===null?10:20);
}
const compact=manifest.changes.map(c=>({id:c.id,label:c.label,beforeHash:fingerprint(c.before),afterHash:fingerprint(c.after),patch:delta(c)}));
const models=manifest.models.map(m=>({id:m.id,beforeHash:fingerprint(m.before),afterHash:fingerprint(m.after)}));
const payload=JSON.stringify(compact),modelPayload=JSON.stringify(models);
assert.ok(!payload.includes('$stage47$')&&!modelPayload.includes('$stage47$'));
export const modelProjection="jsonb_build_object('id',s.id,'title',s.title,'question_count',s.question_count,'subject',s.subject,'published',s.published,'free_access',s.free_access)";
const sql=`-- Etapa 47: publicação editorial aprovada pelo fluxo escolhido pelo responsável.
-- Revisão final por IA; revisão humana adicional dispensada expressamente.
-- Sem conceder Premium, liberar checkout, mudar cotas, ACLs ou apagar evidências.
do $stage47$
declare changes jsonb:='${payload.replaceAll("'","''")}'::jsonb;
 models jsonb:='${modelPayload.replaceAll("'","''")}'::jsonb;
 c jsonb; m jsonb; current_content jsonb; current_hash text;
begin
 perform pg_advisory_xact_lock(hashtextextended('editorial_catalog_stage47',47));
 perform 1 from public.questions where id in(select (value->>'id')::uuid from jsonb_array_elements(changes)) order by id for update;
 perform 1 from public.question_answers where question_id in(select (value->>'id')::uuid from jsonb_array_elements(changes)) order by question_id for update;
 perform 1 from private.simulations where id in(select (value->>'id')::uuid from jsonb_array_elements(models)) order by id for update;
 for c in select value from jsonb_array_elements(changes) loop
  select ${projection} into current_content from public.questions q left join public.question_answers a on a.question_id=q.id where q.id=(c->>'id')::uuid;
  current_hash:=encode(sha256(convert_to(current_content::text,'UTF8')),'hex');
  if current_hash is null or (current_hash<>c->>'beforeHash' and current_hash<>c->>'afterHash') then raise exception 'stage47_content_diverged: %',c->>'label';end if;
  if current_hash<>c->>'afterHash' and (
   exists(select 1 from private.practice_attempts where question_id=(c->>'id')::uuid)
   or exists(select 1 from private.guest_quiz_questions where question_id=(c->>'id')::uuid)
   or exists(select 1 from private.simulation_attempts where snapshots @> jsonb_build_array(jsonb_build_object('id',c->>'id')))) then raise exception 'stage47_content_used: %',c->>'label';end if;
 end loop;
 for m in select value from jsonb_array_elements(models) loop
  select ${modelProjection} into current_content from private.simulations s where s.id=(m->>'id')::uuid;
  current_hash:=encode(sha256(convert_to(current_content::text,'UTF8')),'hex');
  if current_hash is null or (current_hash<>m->>'beforeHash' and current_hash<>m->>'afterHash') then raise exception 'stage47_model_diverged';end if;
 end loop;
 for c in select value from jsonb_array_elements(changes) loop
  select ${projection} into current_content from public.questions q left join public.question_answers a on a.question_id=q.id where q.id=(c->>'id')::uuid;
  if encode(sha256(convert_to(current_content::text,'UTF8')),'hex')=c->>'afterHash' then continue;end if;
  update public.questions set statement=coalesce(c->'patch'->>'statement',statement),topic=coalesce(c->'patch'->>'topic',topic),difficulty=coalesce(c->'patch'->>'difficulty',difficulty),
   option_a=coalesce(c->'patch'->'options'->>0,option_a),option_b=coalesce(c->'patch'->'options'->>1,option_b),option_c=coalesce(c->'patch'->'options'->>2,option_c),
   option_d=coalesce(c->'patch'->'options'->>3,option_d),option_e=coalesce(c->'patch'->'options'->>4,option_e),
   target_exam=coalesce(c->'patch'->>'targetExam',target_exam),status='published',version=coalesce((c->'patch'->>'version')::int,version) where id=(c->>'id')::uuid;
  if (c->'patch') ?| array['correctAnswer','explanation'] then
   update public.question_answers set correct_answer=coalesce(c->'patch'->>'correctAnswer',correct_answer),explanation=coalesce(c->'patch'->>'explanation',explanation) where question_id=(c->>'id')::uuid;
  end if;
  select ${projection} into current_content from public.questions q left join public.question_answers a on a.question_id=q.id where q.id=(c->>'id')::uuid;
  if encode(sha256(convert_to(current_content::text,'UTF8')),'hex')<>c->>'afterHash' then raise exception 'stage47_after_mismatch: %',c->>'label';end if;
 end loop;
 for m in select value from jsonb_array_elements(models) loop
  update private.simulations set published=true where id=(m->>'id')::uuid and not published;
  select ${modelProjection} into current_content from private.simulations s where s.id=(m->>'id')::uuid;
  if encode(sha256(convert_to(current_content::text,'UTF8')),'hex')<>m->>'afterHash' then raise exception 'stage47_model_after_mismatch';end if;
 end loop;
end $stage47$;
`;
assert.ok(Buffer.byteLength(JSON.stringify({query:sql}))<500000);
assert.ok(process.argv.slice(2).every(arg=>arg==='--check'));
const file=new URL('supabase/content/publicacao-etapa-47.sql',root);
if(process.argv.includes('--check'))assert.equal(readFileSync(file,'utf8').replaceAll('\r\n','\n'),sql);
else writeFileSync(file,sql);
console.log('Publicação protegida preparada: 500 questões e seis modelos; nenhuma execução no banco.');
