import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const migrations=process.argv.includes('--candidate-name')?['20261024190000_account_signup_name.sql']:process.argv.includes('--candidate-theme')?['20261024180000_account_theme.sql']:process.argv.includes('--candidate')?['20261024160000_private_account_profiles.sql','20261024180000_account_theme.sql']:[];
const candidate=migrations.map(file=>readFileSync('supabase/migrations/'+file,'utf8')).join('\n');
const image=(await sharp({create:{width:16,height:16,channels:3,background:'#237b38'}}).webp().toBuffer()).toString('base64');
const file=path.resolve('supabase/.temp/account-profiles-'+randomUUID()+'.sql');
try{
 writeFileSync(file,"BEGIN; SET LOCAL statement_timeout='25s';\n"+candidate+'\n'+readFileSync('supabase/tests/test_account_profiles.sql','utf8').replaceAll('__AVATAR__',image)+'\nROLLBACK;');
 const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:45000});
 if(r.status!==0||r.error||!r.stdout.includes('account_profiles_sql_passed')||/"_tag"\s*:\s*"Error"/.test(r.stdout)){
  writeFileSync(path.join(process.env.TEMP,'meta-account-sql-diagnostic.txt'),r.stdout+r.stderr);throw Error('SQL não aprovado; diagnóstico em TEMP/meta-account-sql-diagnostic.txt.');
 }
 console.log('SQL aprovado: perfil gratuito, foto privada, isolamento, preservação de campos, remoção, limite, ACL e RLS. Fixtures revertidas por ROLLBACK.');
}finally{rmSync(file,{force:true});}
