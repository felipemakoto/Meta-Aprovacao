// Only temporary fixtures and candidate DDL, all enclosed in ROLLBACK.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json');
const cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const directory=path.resolve('supabase/.temp');mkdirSync(directory,{recursive:true});
const file=path.join(directory,`first-purchase-${randomUUID()}.sql`);
const migration=process.argv.includes('--applied')?'':readFileSync('supabase/migrations/20261017210000_first_purchase_promotion.sql','utf8');
try{
 writeFileSync(file,'BEGIN;\n'+migration+'\n'+readFileSync('supabase/tests/test_first_purchase_promotion.sql','utf8')+'\nROLLBACK;');
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:60000});
 if(r.status!==0||r.error||/"_tag"\s*:\s*"Error"/.test(r.stdout)||!r.stdout.includes('first_purchase_promotion_passed')){
  console.error({status:r.status,code:r.error?.code,diagnostics:[...new Set((r.stdout+r.stderr).match(/promotion_[a-z_]+/g)??[])]});
  throw Error('Ensaio SQL de promoção não concluído; nenhuma transação confirmada.');
 }
 console.log('SQL aprovado: desconto somente antes da primeira prova, expiração/reembolso, isolamento, intenção regular sem cupom e permissões. ROLLBACK concluído.');
}finally{rmSync(file,{force:true});}
