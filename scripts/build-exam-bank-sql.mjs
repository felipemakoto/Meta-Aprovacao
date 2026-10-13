import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { loadCatalog, root } from "./lib/editorial-content.mjs";
import { editorialProjection } from "./lib/content-versions.mjs";
const manifest = JSON.parse(readFileSync(new URL("content/revisao-etapa-43.json", root), "utf8"));
const catalog = loadCatalog();
assert.equal(manifest.changes.length, 100);
assert.equal(manifest.additions.length, 400);
assert.equal(manifest.catalogHash, catalog.catalogHash);
for (const c of [...manifest.changes, ...manifest.additions]) {
  assert.deepEqual(c.after, editorialProjection(catalog.questions.find(q => q.id === c.id)));
  assert.equal(c.after.status, "draft");
  if (c.before) assert.equal(c.after.version, c.before.version + 1);
  else assert.equal(c.after.version, 1);
}
const payload = JSON.stringify([...manifest.changes, ...manifest.additions]);
assert.ok(!payload.includes("$stage43$"));
const projection = `jsonb_build_object('subject',q.subject,'topic',q.topic,'difficulty',q.difficulty,'statement',q.statement,
 'options',jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),'correctAnswer',a.correct_answer,
 'explanation',a.explanation,'status',q.status,'version',q.version,'targetExam',q.target_exam)`;
const sql = `-- Etapa 43: 100 reformulações e 400 inserções, apenas rascunhos.
-- Manifesto antes/depois preservado; qualquer divergência aborta toda a carga.
do $stage43$
declare changes jsonb:='${payload.replaceAll("'", "''")}'::jsonb; c jsonb; current_content jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended('editorial_catalog_stage43',43));
 perform 1 from public.questions where id in(select (value->>'id')::uuid from jsonb_array_elements(changes)) order by id for update;
 perform 1 from public.question_answers where question_id in(select (value->>'id')::uuid from jsonb_array_elements(changes)) order by question_id for update;
 for c in select value from jsonb_array_elements(changes) loop
  select ${projection} into current_content from public.questions q left join public.question_answers a on a.question_id=q.id where q.id=(c->>'id')::uuid;
  if c ? 'before' then
   if current_content is distinct from c->'before' and current_content is distinct from c->'after' then raise exception 'stage43_content_diverged: %',c->>'label';end if;
  elsif current_content is not null and current_content is distinct from c->'after' then
   raise exception 'stage43_new_id_conflict: %',c->>'label';
  end if;
  if current_content is distinct from c->'after' and c ? 'before' then
   if exists(select 1 from private.practice_attempts where question_id=(c->>'id')::uuid)
   or exists(select 1 from private.guest_quiz_questions where question_id=(c->>'id')::uuid)
   or exists(select 1 from private.simulation_attempts where snapshots @> jsonb_build_array(jsonb_build_object('id',c->>'id'))) then
    raise exception 'stage43_content_used: %',c->>'label';
   end if;
  end if;
 end loop;
 for c in select value from jsonb_array_elements(changes) loop
  select ${projection} into current_content from public.questions q left join public.question_answers a on a.question_id=q.id where q.id=(c->>'id')::uuid;
  if current_content is not distinct from c->'after' then continue;end if;
  if c ? 'before' then
   update public.questions set statement=c->'after'->>'statement',topic=c->'after'->>'topic',difficulty=c->'after'->>'difficulty',
    option_a=c->'after'->'options'->>0,option_b=c->'after'->'options'->>1,option_c=c->'after'->'options'->>2,
    option_d=c->'after'->'options'->>3,option_e=c->'after'->'options'->>4,target_exam=c->'after'->>'targetExam',version=(c->'after'->>'version')::int
   where id=(c->>'id')::uuid;
   update public.question_answers set correct_answer=c->'after'->>'correctAnswer',explanation=c->'after'->>'explanation' where question_id=(c->>'id')::uuid;
  else
   insert into public.questions(id,subject,topic,difficulty,statement,option_a,option_b,option_c,option_d,option_e,target_exam,status,version)
   values((c->>'id')::uuid,c->'after'->>'subject',c->'after'->>'topic',c->'after'->>'difficulty',c->'after'->>'statement',
    c->'after'->'options'->>0,c->'after'->'options'->>1,c->'after'->'options'->>2,c->'after'->'options'->>3,c->'after'->'options'->>4,
    c->'after'->>'targetExam','draft',1);
   insert into public.question_answers(question_id,correct_answer,explanation) values((c->>'id')::uuid,c->'after'->>'correctAnswer',c->'after'->>'explanation');
  end if;
 end loop;
end $stage43$;
`;
assert.ok(process.argv.slice(2).every(a => a === "--check"));
const file = new URL("supabase/content/revisao-etapa-43.sql", root);
if (process.argv.includes("--check")) assert.equal(readFileSync(file, "utf8").replaceAll("\r\n", "\n"), sql);
else writeFileSync(file, sql);
console.log("Carga de 500 rascunhos preparada, sem execução no banco.");
