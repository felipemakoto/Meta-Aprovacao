import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const candidate=process.argv.includes('--candidate')?['20261021090102_premium_study_workspace.sql','20261021090105_remove_first_purchase_promotion.sql'].map(f=>readFileSync('supabase/migrations/'+f,'utf8')).join('\n'):'';
if(/^\s*(?:begin|commit|rollback)\s*;/im.test(candidate))throw Error('Unexpected transaction command');
const file=path.resolve('supabase/.temp/premium-study-test-'+randomUUID()+'.sql');
const legacy=['test_practice.sql','test_premium_study_benefits.sql','test_cakto_paid_access.sql'].map((f,i)=>`SAVEPOINT legacy_${i};\n`+readFileSync('supabase/tests/'+f,'utf8').replace(/^\s*(?:begin|rollback)\s*;/gim,'')+`\nROLLBACK TO SAVEPOINT legacy_${i}; RELEASE SAVEPOINT legacy_${i};`).join('\n');
try{
 writeFileSync(file,"BEGIN; SET LOCAL statement_timeout='50s';\n"+candidate+'\n'+legacy+'\n'+readFileSync('supabase/tests/test_premium_study_workspace.sql','utf8')+'\nROLLBACK;');
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:90000});
 if(r.status!==0||r.error||!r.stdout.includes('premium_study_sql_passed')||/"_tag"\s*:\s*"Error"/.test(r.stdout)){
  writeFileSync(path.join(process.env.TEMP,'premium-study-sql-diagnostic.txt'),r.stdout+r.stderr);
  console.error({status:r.status,diagnostics:[...new Set((r.stdout+r.stderr).match(/premium_[a-z_]+|ERROR:[^\\\r\n]{0,180}|PL\/pgSQL[^\\\r\n]{0,200}/g)??[])]});throw Error('SQL não aprovado; transação não confirmada.');
 }
 console.log('Premium SQL aprovado: acesso pago/gratuito, isolamento, plano, calendário, SRS, simulados, prazo, estatísticas, biblioteca e preço regular. ROLLBACK concluído.');
}finally{rmSync(file,{force:true});}
