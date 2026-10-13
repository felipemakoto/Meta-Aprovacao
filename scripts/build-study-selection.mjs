// Gera migration incremental; não aplica nem modifica histórico de tentativas.
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const root = new URL("../", import.meta.url);
const practiceSource = readFileSync(new URL("supabase/migrations/20260930120000_question_practice.sql", root), "utf8");
const simulationSource = readFileSync(new URL("supabase/migrations/20260930190000_simulations.sql", root), "utf8");
const extract = (text, name) => {
  const start = text.indexOf(`create function public.${name}(`);
  assert.ok(start >= 0);
  const end = text.indexOf("$$;", start);
  assert.ok(end > start);
  return text.slice(start, end + 3).replace(`create function public.${name}`, `create or replace function private.${name}`);
};
let practice = extract(practiceSource, "start_question_practice");
practice = practice.replace("-- Serializa por usuário", "perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,23));\n  -- Serializa por usuário")
  .replace("join public.question_answers y on y.question_id=x.id", "join public.question_answers y on y.question_id=x.id\n    left join private.study_exposure_counts(p_user_id) e on e.question_id=x.id")
  .replace("order by case when x.id=p_previous then 1 else 0 end,random()", "order by coalesce(e.seen,0),case when x.id=p_previous then 1 else 0 end,coalesce(e.last_seen,'-infinity'::timestamptz),random()");
assert.ok(practice.includes("coalesce(e.seen,0)"));
let simulation = extract(simulationSource, "start_simulation");
simulation = simulation.replace("perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,21));", "perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,23));\n perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,21));")
  .replace("partition by q.subject order by random()", "partition by q.subject order by coalesce(e.seen,0),coalesce(e.last_seen,'-infinity'::timestamptz),random()")
  .replace("join public.question_answers a on a.question_id=q.id", "join public.question_answers a on a.question_id=q.id\n  left join private.study_exposure_counts(p_user_id) e on e.question_id=q.id");
assert.ok(simulation.includes("coalesce(e.seen,0)"));
const sql = `-- Etapa 43: prioriza inéditas; permite repetição silenciosa das menos apresentadas.
-- Histórico de prática, simulados e diagnósticos salvos; sem reset ou aviso de repetição.
create or replace function private.study_exposure_counts(p_user_id uuid)
returns table(question_id uuid,seen bigint,last_seen timestamptz)
language sql stable security definer set search_path='' as $$
 select v.question_id,count(*),max(v.presented_at) from (
  select p.question_id,p.created_at as presented_at from private.practice_attempts p where p.user_id=p_user_id
  union all
  select (s->>'id')::uuid,a.started_at from private.simulation_attempts a
   cross join lateral jsonb_array_elements(a.snapshots) s where a.user_id=p_user_id
  union all
  select q.question_id,a.started_at from private.quiz_result_owners o
   join public.guest_quiz_attempts a on a.id=o.attempt_id
   join private.guest_quiz_questions q on q.attempt_id=a.id where o.user_id=p_user_id
 ) v group by v.question_id;
$$;
${practice}
${simulation}
-- Os implementadores permanecem inacessíveis aos clientes e à API direta.
revoke all on function private.study_exposure_counts(uuid),private.start_question_practice(uuid,text,text,text,text,uuid),private.start_simulation(uuid,uuid)
 from public,anon,authenticated,service_role;
`;
const file = new URL("supabase/migrations/20261012220000_study_selection_priority.sql", root);
assert.ok(process.argv.slice(2).every(a => a === "--check"));
if (process.argv.includes("--check")) assert.equal(readFileSync(file, "utf8").replaceAll("\r\n", "\n"), sql);
else writeFileSync(file, sql);
console.log("Seleção por histórico preparada; nenhuma migration aplicada.");
