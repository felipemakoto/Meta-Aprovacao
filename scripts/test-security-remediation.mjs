// Candidate migrations and fixtures run in one transaction, always rolled back.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json');
const cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const migrations=['20261021003013_security_guest_and_practice.sql','20261021003016_payment_dependency_recovery.sql'];
const candidate=process.argv.includes('--applied')?'':migrations.map(f=>readFileSync('supabase/migrations/'+f,'utf8')).join('\n');
if(/^\s*(?:begin|commit|rollback)\s*;/im.test(candidate))throw Error('Unexpected outer transaction in candidate.');
const regressions=['test_practice.sql','test_cakto_paid_access.sql','test_cakto_lifecycle.sql'].map(f=>readFileSync('supabase/tests/'+f,'utf8').replace(/^\s*(?:begin|rollback)\s*;/gim,'')).join('\n');
const file=path.resolve('supabase/.temp/security-remediation-'+randomUUID()+'.sql');
try{
 writeFileSync(file,'BEGIN;\nSET LOCAL statement_timeout=\'45s\';\n'+candidate+'\n'+regressions+'\n'+readFileSync('supabase/tests/test_security_remediation.sql','utf8')+'\nROLLBACK;');
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:90000});
 if(r.status!==0||r.error||!r.stdout.includes('security_remediation_sql_passed')||/"_tag"\s*:\s*"Error"/.test(r.stdout)){
  // SQL diagnostics only; never echo result rows, credentials or bank content.
  writeFileSync(path.join(process.env.TEMP,'meta-remediation-sql-diagnostic.txt'),r.stdout+r.stderr);
  console.error({status:r.status,code:r.error?.code,diagnostics:[...new Set((r.stdout+r.stderr).match(/security_[a-z_]+|[a-z_]+_check\b|ERROR:[^\\\r\n]{0,140}|PL\/pgSQL[^\\\r\n]{0,140}/g)??[])]});
  throw Error('Ensaio SQL falhou; nenhuma transação confirmada.');
 }
 console.log('SQL aprovado: limites, retomada sem consumo, isolamento, fila fora de ordem, cancelamento, replay e permissões. ROLLBACK concluído.');
}finally{rmSync(file,{force:true});}
