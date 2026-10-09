// Private credentials are read from ignored local files and never printed or placed in argv.
import {randomBytes} from 'node:crypto';
import {parseEnv} from 'node:util';
import {existsSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';
import {automationHeaders} from '../src/lib/subscriptions/automation-http.ts';
const mode=process.argv[2],envFile=path.resolve('.env.cakto-worker.local'),sqlFile=path.resolve('supabase/.temp/automation-config.sql');
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),JSON.parse(readFileSync(pkg,'utf8')).bin.supabase);
function command(args){const r=spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:60000,windowsHide:true});if(r.status!==0||r.error||r.stdout.includes('"_tag":"Error"'))throw Error('Configuração administrativa não concluída.');}
function query(sql){writeFileSync(sqlFile,sql);try{command(['db','query','--linked','--file',sqlFile]);}finally{rmSync(sqlFile,{force:true});}}
try{
 if(mode==='secrets'){
  const ignored=spawnSync('git',['check-ignore',envFile],{encoding:'utf8',windowsHide:true});if(ignored.status!==0)throw Error();
  const old=existsSync(envFile)?parseEnv(readFileSync(envFile,'utf8')):{};
  const values={CAKTO_WORKER_SECRET:old.CAKTO_WORKER_SECRET??randomBytes(32).toString('hex'),CAKTO_CLIENT_ID:process.env.CAKTO_CLIENT_ID,CAKTO_CLIENT_SECRET:process.env.CAKTO_CLIENT_SECRET};
  if(!/^[a-f0-9]{64}$/.test(values.CAKTO_WORKER_SECRET)||Object.values(values).some(v=>typeof v!=='string'||!v||!/^[A-Za-z0-9_.~+/=-]+$/.test(v)))throw Error();
  writeFileSync(envFile,Object.entries(values).map(([k,v])=>`${k}=${v}`).join('\n')+'\n');command(['secrets','set','--env-file',envFile]);
  console.log('Credenciais do worker configuradas no Supabase; cópia local ignorada, nenhum valor exibido.');
 }else if(mode==='configure'){
  const values=parseEnv(readFileSync(envFile,'utf8')),secret=values.CAKTO_WORKER_SECRET,product=process.env.CAKTO_PRODUCT_ID,offers=[...new Set([process.env.CAKTO_REGULAR_OFFER_ID,process.env.CAKTO_OCTOBER_OFFER_ID])];
  const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??'');if(!/^[a-f0-9]{64}$/.test(secret)||!product||![product,...offers].every(v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,200}$/.test(v))||!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url.origin))throw Error();
  query(`do $$declare secret_value uuid;begin
  select id into secret_value from vault.secrets where name='meta_cakto_worker_secret';
  if secret_value is null then secret_value:=vault.create_secret('${secret}','meta_cakto_worker_secret');else perform vault.update_secret(secret_value,'${secret}');end if;
  update private.cakto_automation set endpoint='${url.origin}/functions/v1/cakto-reconcile',secret_id=secret_value,product_id='${product}',offer_ids=array[${offers.map(v=>`'${v}'`).join(',')}];end$$;`);
  console.log('Destino e segredo no Vault configurados. Agendamento ainda não ativado.');
 }else if(mode==='smoke'){
  const values=parseEnv(readFileSync(envFile,'utf8')),url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??''),endpoint=url.origin+'/functions/v1/cakto-reconcile';
  if(!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url.origin)||!/^[a-f0-9]{64}$/.test(values.CAKTO_WORKER_SECRET))throw Error();
  for(const authorization of ['', 'Bearer '+'0'.repeat(64)]){const r=await fetch(endpoint,{method:'POST',headers:{authorization},body:'{}',signal:AbortSignal.timeout(15000)});if(r.status!==401)throw Error();}
  const nonce=randomBytes(32).toString('hex'),headers=automationHeaders(values.CAKTO_WORKER_SECRET,nonce,Date.now());
  query(`update private.cakto_automation set dispatch_hash=encode(extensions.digest('${nonce}','sha256'),'hex'),dispatch_expires_at=clock_timestamp()+interval '90 seconds' where not enabled;`);
  const r=await fetch(endpoint,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(15000)});
  const result=await r.json();if(r.status!==200||result.skipped!==true)throw Error();
  const repeat=await fetch(endpoint,{method:'POST',headers,body:'{}',signal:AbortSignal.timeout(15000)});if(repeat.status!==401)throw Error();
  console.log('Função publicada: assinatura inválida/repetida recebe 401; assinatura temporária válida recebe 200, rotina ainda pausada.');
 }else if(mode==='status'){
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.rpc('cakto_automation_status');if(error)throw Error();console.log(JSON.stringify(data));
 }else if(mode==='activate'){
  query(`do $$declare j bigint;begin if not exists(select 1 from private.cakto_automation a join vault.secrets v on v.id=a.secret_id where a.endpoint is not null and a.product_id is not null) then raise exception 'automation unconfigured';end if;
  update private.cakto_automation set enabled=true,next_discovery_at=clock_timestamp();
  j:=cron.schedule('meta-cakto-reconcile','* * * * *','select private.dispatch_cakto_automation();');perform cron.alter_job(j,active:=true);end$$;`);
  console.log('Agendamento ativado a cada minuto. Checkout não foi alterado.');
 }else if(mode==='pause'){
  query(`do $$declare j bigint;begin update private.cakto_automation set enabled=false;select jobid into j from cron.job where jobname='meta-cakto-reconcile';if j is not null then perform cron.alter_job(j,active:=false);end if;end$$;`);
  console.log('Automação pausada. Períodos pagos preservados.');
 }else throw Error();
}catch{console.error('Configuração administrativa não concluída. Nenhuma credencial exibida; conferir estado antes de repetir.');process.exitCode=1;}
