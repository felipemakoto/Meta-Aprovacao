// All writes are enclosed in a transaction ending in ROLLBACK.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const file=path.resolve('supabase/.temp/intro-test-'+randomUUID()+'.sql');
const migration=process.argv.includes('--applied')?'':readFileSync('supabase/migrations/20261015010000_intro_quiz_catalog.sql','utf8');
try {
 writeFileSync(file,'BEGIN;\n'+migration+'\n'+readFileSync('supabase/tests/test_intro_quiz.sql','utf8')+'\nROLLBACK;');
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:60000});
 if(r.status!==0||r.error||!r.stdout.includes('intro_sql_passed')) {
  console.error({status:r.status,code:r.error?.code,diagnostics:[...new Set((r.stdout+r.stderr).match(/intro_[a-z_]+/g)??[])]});throw Error('Ensaio SQL falhou; nenhuma transação confirmada.');
 }
 console.log('SQL aprovado: catálogo fixo, correção, idempotência, snapshots, separação do banco e permissões. ROLLBACK concluído.');
}finally{rmSync(file,{force:true});}
