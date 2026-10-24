import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const candidate=process.argv.includes('--candidate')?readFileSync('supabase/migrations/20261024143000_security_request_budgets.sql','utf8'):'';
const file=path.resolve('supabase/.temp/security-budgets-'+randomUUID()+'.sql');
try{
 writeFileSync(file,"BEGIN; SET LOCAL statement_timeout='25s';\n"+candidate+'\n'+readFileSync('supabase/tests/test_security_budgets.sql','utf8')+'\nROLLBACK;');
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:45000});
 if(r.status!==0||r.error||!r.stdout.includes('security_budgets_sql_passed')||/"_tag"\s*:\s*"Error"/.test(r.stdout)){
  writeFileSync(path.join(process.env.TEMP,'meta-security-budgets-sql-diagnostic.txt'),r.stdout+r.stderr);throw Error('SQL não aprovado; diagnóstico em TEMP/meta-security-budgets-sql-diagnostic.txt.');
 }
 console.log('SQL aprovado: limites por rede/conta/par, expiração, Premium, concorrência de PDF, cota, ACL, RLS e isolamento. Fixtures revertidas por ROLLBACK.');
}finally{rmSync(file,{force:true});}
