// Exercita correção e rejeições no banco vinculado, sempre com rollback.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { revision } from "./lib/content-versions.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const packagePath = require.resolve("supabase/package.json");
const cli = require(packagePath);
const entry = path.resolve(path.dirname(packagePath), cli.bin.supabase);
const file = path.join(root, "supabase/.temp/test-editorial-correction.sql");
const patch = readFileSync(path.join(root, "supabase/content/revisao-etapa-41.sql"), "utf8");
assert.equal(patch.split("do $stage41$").length, 2);
const fn = patch.replace("do $stage41$", "create function pg_temp.stage41_apply() returns void language plpgsql as $stage41$");
const quote = s => `'${s.replaceAll("'", "''")}'`;
const payload = `${quote(JSON.stringify(revision.changes))}::jsonb`;
const ids = revision.changes.map(c => quote(c.id)).join(",");
const snapshot = `md5(coalesce((select jsonb_agg(to_jsonb(q) order by id)::text from public.questions q),'[]')||coalesce((select jsonb_agg(to_jsonb(a) order by question_id)::text from public.question_answers a),'[]')||coalesce((select jsonb_agg(to_jsonb(s) order by id)::text from private.simulations s),'[]'))`;
const untouched = `md5(coalesce((select jsonb_agg(to_jsonb(q) order by id)::text from public.questions q where id not in(${ids})),'[]')||coalesce((select jsonb_agg(to_jsonb(a) order by question_id)::text from public.question_answers a where question_id not in(${ids})),'[]')||coalesce((select jsonb_agg(to_jsonb(s) order by id)::text from private.simulations s),'[]'))`;
const reset = `update public.questions q set statement=c->'before'->>'statement',topic=c->'before'->>'topic',difficulty=c->'before'->>'difficulty',
 option_a=c->'before'->'options'->>0,option_b=c->'before'->'options'->>1,option_c=c->'before'->'options'->>2,
 option_d=c->'before'->'options'->>3,option_e=c->'before'->'options'->>4,status='draft',version=1
 from jsonb_array_elements(${payload}) c where q.id=(c->>'id')::uuid;
 update public.question_answers a set correct_answer=c->'before'->>'correctAnswer',explanation=c->'before'->>'explanation'
 from jsonb_array_elements(${payload}) c where a.question_id=(c->>'id')::uuid;`;
const qid = revision.changes.at(-1).id;
const uid = "d1411000-0000-4000-8000-000000000001";
const aid = "d1411000-0000-4000-8000-000000000002";
const cases = [
  ["conteúdo modificado", `update public.questions set statement='Alteração editorial temporária' where id='${qid}';`, "stage41_content_diverged"],
  ["conteúdo revisado", `update public.questions set status='reviewed' where id='${qid}';`, "stage41_content_diverged"],
  ["conteúdo publicado", `update public.questions set status='published' where id='${qid}';`, "stage41_content_diverged"],
  ["gabarito ausente", `delete from public.question_answers where question_id='${qid}';`, "stage41_missing_content"],
  ["gabarito alterado", `update public.question_answers set explanation='Explicação editorial temporária' where question_id='${qid}';`, "stage41_content_diverged"],
  ["diagnóstico usado", `insert into public.guest_quiz_attempts(id,token_hash) values('${aid}',repeat('4',64));
   insert into private.guest_quiz_questions(attempt_id,position,question_id,question_version,subject,topic,statement,options,correct_answer,explanation)
   select '${aid}',1,q.id,q.version,q.subject,q.topic,q.statement,jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),a.correct_answer,a.explanation
   from public.questions q join public.question_answers a on a.question_id=q.id where q.id='${qid}';`, "stage41_content_already_used"],
  ["prática usada", `insert into auth.users(id,email_confirmed_at) values('${uid}',now());
   insert into private.practice_attempts(user_id,question_id,snapshot) values('${uid}','${qid}','{}');`, "stage41_content_already_used"],
  ["simulado usado", `insert into auth.users(id,email_confirmed_at) values('${uid}',now());
   insert into private.simulation_attempts(user_id,simulation_id,title,snapshots)
   values('${uid}','d1395000-0000-4000-8000-000000000001','Fixture etapa 41','[{"id":"${qid}"}]');`, "stage41_content_already_used"],
];
const negatives = cases.map(([name, mutation, reason]) => `do $test$ declare h text;begin
 h:=${snapshot};
 begin ${mutation} perform pg_temp.stage41_apply();raise exception 'guard_did_not_reject';
 exception when others then if position('${reason}' in sqlerrm)=0 then raise;end if;end;
 if h<>${snapshot} then raise exception 'Fixture não revertida: ${name}';end if;
end $test$;`).join("\n");
const sql = `begin;
set local statement_timeout='15s';
${fn}
-- Validar o estado real antes de preparar fixtures locais da versão antiga.
select pg_temp.stage41_apply();
${reset}
${negatives}
do $test$ declare h text;begin
 h:=${untouched};perform pg_temp.stage41_apply();
 if h<>${untouched} then raise exception 'Questões anteriores ou modelos alterados';end if;
 if (select count(*) from public.questions where id in(${ids}) and status='draft' and version=2)<>90 then raise exception 'Versões inesperadas';end if;
 h:=${snapshot};perform pg_temp.stage41_apply();perform pg_temp.stage41_apply();
 if h<>${snapshot} then raise exception 'Reexecução alterou conteúdo ou timestamps';end if;
end $test$;
select 'correction_atomic_repeatable_and_eight_guards' as check_name,true as passed;
rollback;`;
try {
  writeFileSync(file, sql);
  const result = spawnSync(process.execPath, [entry, "db", "query", "--linked", "--file", file], { cwd: root, stdio: "inherit", timeout: 60000, windowsHide: true });
  if (result.error || result.status !== 0) throw Error("Ensaio da correção falhou; transação sem COMMIT.");
} finally { rmSync(file, { force: true }); }
