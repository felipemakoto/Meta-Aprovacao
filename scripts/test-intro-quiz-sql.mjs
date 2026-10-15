// All writes are enclosed in a transaction ending in ROLLBACK.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const file=path.resolve('supabase/.temp/intro-test-'+randomUUID()+'.sql');
const rawMigration=process.argv.includes('--applied')?'':readFileSync('supabase/migrations/20261015020000_intro_quiz_contextualized.sql','utf8');
// Remove only the outer deployment transaction; the test must always end in rollback.
const migration=rawMigration.replace(/^begin;\r?\n/i,'').replace(/\r?\ncommit;\s*$/i,'');
if(/^\s*(?:begin|commit|rollback)\s*;/im.test(migration))throw Error('Unexpected transaction command in candidate migration.');
const before=migration?`create temporary table intro_open_before as select encode(extensions.gen_random_bytes(32),'hex') as token;
alter table intro_open_before add column quiz jsonb;
update intro_open_before set quiz=public.start_guest_quiz(token);
create temporary table intro_bank_before as select md5(coalesce(jsonb_agg(to_jsonb(q) order by q.id)::text,'[]')) as hash from public.questions q where status='published';
create temporary table intro_answers_before as select md5(coalesce(jsonb_agg(to_jsonb(a) order by question_id)::text,'[]')) as hash from public.question_answers a join public.questions q on q.id=a.question_id where q.status='published';` : '';
const after=migration?`do $$begin
 if (select public.read_guest_quiz(token) from intro_open_before)<>(select quiz from intro_open_before) then raise exception 'intro_old_attempt_changed';end if;
 if (select hash from intro_bank_before)<>(select md5(coalesce(jsonb_agg(to_jsonb(q) order by q.id)::text,'[]')) from public.questions q where status='published') then raise exception 'intro_published_content_changed';end if;
 if (select hash from intro_answers_before)<>(select md5(coalesce(jsonb_agg(to_jsonb(a) order by question_id)::text,'[]')) from public.question_answers a join public.questions q on q.id=a.question_id where q.status='published') then raise exception 'intro_published_answers_changed';end if;
end$$;` : '';
try {
 writeFileSync(file,'BEGIN;\n'+before+'\n'+migration+'\n'+after+'\n'+readFileSync('supabase/tests/test_intro_quiz.sql','utf8')+'\nROLLBACK;');
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:60000});
 if(r.status!==0||r.error||!r.stdout.includes('intro_sql_passed')) {
  console.error({status:r.status,code:r.error?.code,diagnostics:[...new Set((r.stdout+r.stderr).match(/intro_[a-z_]+/g)??[])]});throw Error('Ensaio SQL falhou; nenhuma transação confirmada.');
 }
 console.log('SQL aprovado: catálogo fixo, correção, idempotência, snapshots, separação do banco e permissões. ROLLBACK concluído.');
}finally{rmSync(file,{force:true});}
