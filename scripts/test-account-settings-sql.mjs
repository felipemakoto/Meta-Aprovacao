import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase);
const names=process.argv.includes('--candidate')?['20261024202325_account_preferences_privacy.sql','20261024205546_account_notification_preferences.sql','20261024211822_account_quiz_export.sql']:process.argv.includes('--candidate-export')?['20261024211822_account_quiz_export.sql']:[];
const candidate=names.map(f=>readFileSync('supabase/migrations/'+f,'utf8')).join('\n');
const file=path.resolve('supabase/.temp/settings-'+randomUUID()+'.sql');
try{writeFileSync(file,"BEGIN;SET LOCAL statement_timeout='25s';\n"+candidate+'\n'+readFileSync('supabase/tests/test_account_settings.sql','utf8')+'\nROLLBACK;');const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:45000});if(r.status!==0||r.error||!r.stdout.includes('settings_sql_passed')||/"_tag"\s*:\s*"Error"/.test(r.stdout)){writeFileSync(path.join(process.env.TEMP,'meta-settings-sql-diagnostic.txt'),r.stdout+r.stderr);throw Error('SQL não aprovado; diagnóstico em TEMP/meta-settings-sql-diagnostic.txt.');}console.log('SQL aprovado: preferências, isolamento, exportação sem respostas protegidas, exclusão atômica, sessões, bloqueio financeiro e ACL. Tudo revertido por ROLLBACK.');}finally{rmSync(file,{force:true});}
