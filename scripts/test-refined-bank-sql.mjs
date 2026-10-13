// Ensaio transacional integral; fixtures e DDL temporários sempre revertidos.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {delta} from "./lib/editorial-patch.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(path.join(root, "content/revisao-etapa-45.json"), "utf8"));
const patch = readFileSync(path.join(root, "supabase/content/revisao-etapa-45.sql"), "utf8");
assert.equal(patch.split("do $stage45$").length, 2);
const fn = patch.replace("do $stage45$", "create function pg_temp.stage45_apply() returns void language plpgsql as $stage45$");
const quote = s => `'${s.replaceAll("'", "''")}'`;
const old = quote(JSON.stringify(manifest.changes.map(c=>({id:c.id,patch:delta(c,"before")})))) + "::jsonb";

const snapshot = `(select md5(coalesce(jsonb_agg(to_jsonb(q) order by id)::text,'[]')) from public.questions q)||(select md5(coalesce(jsonb_agg(to_jsonb(a) order by question_id)::text,'[]')) from public.question_answers a)`;
const changedIds = manifest.changes.map(c => quote(c.id)).join(',');
const protectedSnapshot = `(select md5(coalesce(jsonb_agg(to_jsonb(q) order by id)::text,'[]')) from public.questions q where id not in(${changedIds})) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(a) order by question_id)::text,'[]')) from public.question_answers a where question_id not in(${changedIds})) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(s) order by id)::text,'[]')) from private.simulations s) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(p) order by id)::text,'[]')) from private.practice_attempts p) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(a) order by id)::text,'[]')) from private.simulation_attempts a) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(a) order by id)::text,'[]')) from public.guest_quiz_attempts a) ||
 (select md5(coalesce(jsonb_agg(to_jsonb(q) order by attempt_id,position)::text,'[]')) from private.guest_quiz_questions q)`;
const qid = manifest.changes.at(-1).id;
const uid = "d1459000-0000-4000-8000-000000000001";
const aid = "d1459000-0000-4000-8000-000000000002";
const cases = [
  ["alteração editorial", `update public.questions set statement='Fixture modificada' where id='${qid}';`, "stage45_content_diverged"],
  ["revisada", `update public.questions set status='reviewed' where id='${qid}';`, "stage45_content_diverged"],
  ["publicada", `update public.questions set status='published' where id='${qid}';`, "stage45_content_diverged"],
  ["gabarito ausente", `delete from public.question_answers where question_id='${qid}';`, "stage45_content_diverged"],
  ["gabarito modificado", `update public.question_answers set correct_answer=case when correct_answer='A' then 'B' else 'A' end where question_id='${qid}';`, "stage45_content_diverged"],
  ["prática existente", `insert into auth.users(id,email_confirmed_at) values('${uid}',now());insert into private.practice_attempts(user_id,question_id,snapshot) values('${uid}','${qid}','{}');`, "stage45_content_used"],
  ["simulado existente", `insert into auth.users(id,email_confirmed_at) values('${uid}',now());insert into private.simulation_attempts(user_id,simulation_id,title,snapshots) select '${uid}',id,'Fixture','[{"id":"${qid}"}]' from private.simulations order by id limit 1;`, "stage45_content_used"],
  ["diagnóstico existente", `insert into public.guest_quiz_attempts(id,token_hash) values('${aid}',repeat('3',64));
   insert into private.guest_quiz_questions(attempt_id,position,question_id,question_version,subject,topic,statement,options,correct_answer,explanation)
   select '${aid}',1,q.id,q.version,q.subject,q.topic,q.statement,jsonb_build_array(q.option_a,q.option_b,q.option_c,q.option_d,q.option_e),a.correct_answer,a.explanation from public.questions q join public.question_answers a on a.question_id=q.id where q.id='${qid}';`, "stage45_content_used"],
  ["versão divergente", `update public.questions set version=version+9 where id='${qid}';`, "stage45_content_diverged"],
];
const guards = cases.map(([name, mutation, reason]) => `do $guard$ declare h text;begin h:=${snapshot};
 begin ${mutation} perform pg_temp.stage45_apply();raise exception 'guard_not_rejected';
 exception when others then if position('${reason}' in sqlerrm)=0 then raise;end if;end;
 if h<>(${snapshot}) then raise exception 'Fixture não revertida: ${name}';end if;
end $guard$;`).join("\n");
const reset = `
 create temporary table quality_reset as select value as c from jsonb_array_elements(${old});
 update public.questions q set statement=coalesce(c->'patch'->>'statement',statement),topic=coalesce(c->'patch'->>'topic',topic),difficulty=coalesce(c->'patch'->>'difficulty',difficulty),
 option_a=coalesce(c->'patch'->'options'->>0,option_a),option_b=coalesce(c->'patch'->'options'->>1,option_b),option_c=coalesce(c->'patch'->'options'->>2,option_c),
 option_d=coalesce(c->'patch'->'options'->>3,option_d),option_e=coalesce(c->'patch'->'options'->>4,option_e),
 target_exam=coalesce(c->'patch'->>'targetExam',target_exam),status='draft',version=(c->'patch'->>'version')::int from quality_reset where q.id=(c->>'id')::uuid;
 update public.question_answers a set correct_answer=coalesce(c->'patch'->>'correctAnswer',correct_answer),explanation=coalesce(c->'patch'->>'explanation',explanation)
 from quality_reset where a.question_id=(c->>'id')::uuid;`;
const sql = `begin;set local statement_timeout='30s';
${fn}
-- Primeiro validar o estado real; não substituir revisão divergente para montar fixture.
select pg_temp.stage45_apply();
${reset}
${guards}
do $positive$ declare h text;begin
 h:=${protectedSnapshot};perform pg_temp.stage45_apply();
 if h<>(${protectedSnapshot}) then raise exception 'Modelos ou tentativas alterados';end if;
 if (select count(*) from public.questions where status='draft')<>500 then raise exception 'Carga incompleta';end if;
 if exists(select subject from public.questions group by subject having count(*)<>100) then raise exception 'Distribuição incorreta';end if;
 h:=${snapshot};perform pg_temp.stage45_apply();perform pg_temp.stage45_apply();
 if h<>(${snapshot}) then raise exception 'Reexecução alterou registros ou timestamps';end if;
end $positive$;
select '500_drafts_quality_nine_guards_repeatable' as check_name,true as passed;
rollback;`;
const require = createRequire(import.meta.url);
const pkg = require.resolve("supabase/package.json");
const entry = path.resolve(path.dirname(pkg), require(pkg).bin.supabase);
const file = path.join(root, "supabase/.temp/test-refined-bank.sql");
try {
  writeFileSync(file, sql);
  const result = spawnSync(process.execPath, [entry, "db", "query", "--linked", "--file", file], { cwd: root, encoding: "utf8", timeout: 90000, windowsHide: true, maxBuffer: 2 * 1024 * 1024 });
  if (result.error || result.status !== 0) { console.error({status:result.status,signal:result.signal,code:result.error?.code,message:result.error?.message,diagnostic:(result.stdout+"\n"+result.stderr).slice(-1500)}); throw Error("Ensaio falhou; transação sem COMMIT."); }
  console.log("Ensaio SQL aprovado: 500 rascunhos, nove rejeições, reexecução sem alterações e preservação de modelos/tentativas. Rollback concluído.");
} finally { unlinkSync(file); }
