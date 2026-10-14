// All fixtures, scheduler changes and the candidate migration are rolled back together.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const migration=readFileSync('supabase/migrations/20261014230000_cakto_automation_diagnostics.sql','utf8');
const suites=['test_cakto_automation.sql','test_cakto_automation_diagnostics.sql','test_cakto_payment_checks.sql','test_cakto_paid_access.sql','test_cakto_lifecycle.sql','test_cakto_reconciliation.sql'];
const bodies=suites.map(name=>{
 const sql=readFileSync('supabase/tests/'+name,'utf8');
 assert.match(sql,/^begin;/i);assert.match(sql,/rollback;\s*$/i);
 const body=sql.replace(/^begin;/i,'').replace(/rollback;\s*$/i,'');
 assert.doesNotMatch(body,/\b(?:commit|rollback)\s*;/i);
 return body;
});
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json');
const cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
mkdirSync('supabase/.temp',{recursive:true});
const file=path.resolve('supabase/.temp/diagnostics-'+randomUUID()+'.sql');
try{
 writeFileSync(file,"begin;\nset local statement_timeout='60s';\n"+migration+'\n'+bodies.join('\n')+"\nselect true as stage48_rollback_suites_passed;\nrollback;\n");
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file],{encoding:'utf8',windowsHide:true,timeout:90000,maxBuffer:2*1024*1024});
 if(r.status!==0||r.error||/"_tag"\s*:\s*"Error"/.test(r.stdout)||!r.stdout.includes('stage48_rollback_suites_passed')){
  const diagnostics=[...new Set((r.stdout+'\n'+r.stderr).match(/\b(?:diagnostic_[a-z_]+|automation_[a-z_]+)\b/g)??[])];
  console.error({status:r.status,code:r.error?.code,diagnostics});
  throw Error('Ensaio SQL não concluído; nenhuma transação com COMMIT foi enviada.');
 }
 console.log('Seis suítes SQL aprovadas e revertidas: automação, diagnóstico, pagamento, períodos de acesso, ciclo da assinatura e reconciliação. Nenhuma compra real.');
}finally{rmSync(file,{force:true});}
