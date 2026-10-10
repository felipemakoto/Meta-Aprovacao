// Gera uma correção explícita de rascunhos; não executa SQL nem publica.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { loadCatalog, root, summarize } from "./lib/editorial-content.mjs";
import { editorialProjection, revision } from "./lib/content-versions.mjs";

assert.ok(process.argv.slice(2).every(a => a === "--check"));
assert.equal(revision.changes.length, 90);
const catalog = loadCatalog();
const changedLabels = new Set(["P04", "C16", "C19", "H09"]);
for (const c of revision.changes) {
  const q = catalog.questions.find(q => q.id === c.id);
  assert.equal(q.label, c.label);
  assert.deepEqual(editorialProjection(q), c.after, `Manifesto divergente: ${c.label}`);
  assert.notDeepEqual(c.before.options, c.after.options);
  if (!changedLabels.has(c.label)) {
    assert.deepEqual([...c.before.options].sort(), [...c.after.options].sort());
    for (const field of ["statement", "explanation", "topic", "difficulty"]) assert.equal(c.before[field], c.after[field]);
  }
  if (c.label !== "P04") assert.equal(c.before.options["ABCDE".indexOf(c.before.correctAnswer)], c.after.options["ABCDE".indexOf(c.after.correctAnswer)]);
  assert.equal(c.before.subject, c.after.subject);
  assert.equal(c.before.targetExam, c.after.targetExam);
}
const summaries = summarize(catalog);
assert.ok(summaries.every(s => s.repeats < 12));
assert.equal(new Set(summaries.map(s => s.letters)).size, 5);
const json = JSON.stringify(revision.changes);
assert.ok(!json.includes("$stage41$"));
const payload = `'${json.replaceAll("'", "''")}'::jsonb`;
const projection = `jsonb_build_object('subject',q.subject,'topic',q.topic,'difficulty',q.difficulty,
 'statement',q.statement,'options',jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),
 'correctAnswer',a.correct_answer,'explanation',a.explanation,'status',q.status,'version',q.version,'targetExam',q.target_exam)`;
const ids = "select (value->>'id')::uuid from jsonb_array_elements(changes)";
const sql = `-- Etapa 41: correção explícita, atômica e repetível de 90 rascunhos não usados.
-- Antes/depois em content/revisao-etapa-41.json. Nenhuma publicação/modelo/permissão alterados.
-- Interrompe se houver divergência, revisão/publicação, gabarito ausente ou tentativa existente.
do $stage41$
declare
 changes jsonb := ${payload};
 change jsonb; current_content jsonb;
begin
 if jsonb_array_length(changes)<>90 then raise exception 'stage41_invalid_manifest';end if;
 perform 1 from public.questions where id in (${ids}) order by id for update;
 perform 1 from public.question_answers where question_id in (${ids}) order by question_id for update;
 if (select count(*) from public.questions where id in (${ids}))<>90
 or (select count(*) from public.question_answers where question_id in (${ids}))<>90 then
  raise exception 'stage41_missing_content';
 end if;
 if exists(select 1 from private.guest_quiz_questions where question_id in (${ids}))
 or exists(select 1 from private.practice_attempts where question_id in (${ids}))
 or exists(select 1 from private.simulation_attempts a cross join lateral jsonb_array_elements(a.snapshots) s
           where s->>'id' in (select value->>'id' from jsonb_array_elements(changes))) then
  raise exception 'stage41_content_already_used';
 end if;
 for change in select value from jsonb_array_elements(changes) loop
  select ${projection} into current_content
  from public.questions q join public.question_answers a on a.question_id=q.id where q.id=(change->>'id')::uuid;
  if current_content is distinct from change->'before' and current_content is distinct from change->'after' then
   raise exception 'stage41_content_diverged: %',change->>'label';
  end if;
 end loop;
 for change in select value from jsonb_array_elements(changes) loop
  if (select version from public.questions where id=(change->>'id')::uuid)=1 then
   update public.questions set statement=change->'after'->>'statement',topic=change->'after'->>'topic',
    difficulty=change->'after'->>'difficulty',option_a=change->'after'->'options'->>0,
    option_b=change->'after'->'options'->>1,option_c=change->'after'->'options'->>2,
    option_d=change->'after'->'options'->>3,option_e=change->'after'->'options'->>4,version=2
   where id=(change->>'id')::uuid;
   update public.question_answers set correct_answer=change->'after'->>'correctAnswer',explanation=change->'after'->>'explanation'
   where question_id=(change->>'id')::uuid
    and (correct_answer is distinct from change->'after'->>'correctAnswer' or explanation is distinct from change->'after'->>'explanation');
  end if;
 end loop;
end
$stage41$;
`;
const file = new URL("supabase/content/revisao-etapa-41.sql", root);
if (process.argv.includes("--check")) assert.equal(readFileSync(file, "utf8").replaceAll("\r\n", "\n"), sql);
else writeFileSync(file, sql);
console.log("Correção de 90 rascunhos preparada: associação da resposta preservada, versões 1→2; banco não alterado.");
