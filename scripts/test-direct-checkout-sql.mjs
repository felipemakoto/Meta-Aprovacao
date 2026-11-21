import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const file=path.resolve('supabase/.temp/direct-checkout-test-'+randomUUID()+'.sql');
try{
 const candidate=process.argv.includes('--candidate-handoff')?readFileSync('supabase/migrations/20261022014708_direct_checkout_atomic_handoff.sql','utf8'):process.argv.includes('--candidate')?readFileSync('supabase/migrations/20261022011944_direct_premium_checkout.sql','utf8')+'\n'+readFileSync('supabase/migrations/20261022014708_direct_checkout_atomic_handoff.sql','utf8'):'';
 writeFileSync(file,"BEGIN; SET LOCAL statement_timeout='45s';\n"+candidate+'\n'+readFileSync('supabase/tests/test_direct_checkout.sql','utf8')+'\nROLLBACK;');
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:65000});
 if(r.status!==0||r.error||!r.stdout.includes('direct_checkout_sql_passed')||/"_tag"\s*:\s*"Error"/.test(r.stdout)){
  writeFileSync(path.join(process.env.TEMP,'meta-direct-sql-diagnostic.txt'),r.stdout+r.stderr);console.error('SQL não aprovado. Diagnóstico local em TEMP/meta-direct-sql-diagnostic.txt.');process.exitCode=1;
 }else console.log('SQL aprovado: ACL, RLS, isolamento, tentativa única, lease, retomada, retenção, sem concessão de Premium. ROLLBACK concluído.');
}finally{rmSync(file,{force:true});}
