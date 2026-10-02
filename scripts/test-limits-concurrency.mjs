// Fixture isolada. As questões ficam draft em todo estado confirmado no banco.
// A função temporária publica somente dentro da transação da chamada, restaurando
// draft antes do commit. Isso permite testar os RPCs reais sem expor conteúdo.
import {randomUUID} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
if(!url||!key?.startsWith('sb_secret_'))throw Error('Configure o ambiente do servidor antes deste teste.');
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json');
const entry=path.resolve(path.dirname(pkg),JSON.parse(readFileSync(pkg,'utf8')).bin.supabase);
const dir=path.resolve('supabase/.temp');mkdirSync(dir,{recursive:true});
const user=randomUUID(),simIds=[randomUUID(),randomUUID()],qIds=Array.from({length:10},()=>randomUUID());
const fn='test_limits_'+user.replaceAll('-',''),topic='__'+fn+'__';
const file=path.join(dir,fn+'.sql');
function query(sql){
 writeFileSync(file,sql);
 const r=spawnSync(process.execPath,[entry,'db','query','--linked','--file',file],{encoding:'utf8',timeout:60000,windowsHide:true});
 if(r.status!==0||r.error||r.stdout.includes('"_tag":"Error"'))throw Error('Consulta de fixture falhou; SQL temporário preservado para diagnóstico.');
}
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const rpc=(name,args)=>client.rpc(name,args).abortSignal(AbortSignal.timeout(20000));
const subjects=['matematica','portugues','ciencias','historia','geografia'];
const questions=qIds.map((id,i)=>`('${id}','Concorrência privada','1','2','3','4','5','${subjects[Math.floor(i/2)]}','${topic}','easy','both','draft')`).join(',');
const ids=qIds.map(id=>`'${id}'::uuid`).join(',');
let created=false;
try{
 query(`begin;
 insert into auth.users(id,email_confirmed_at) values('${user}',now());
 insert into public.questions(id,statement,option_a,option_b,option_c,option_d,option_e,subject,topic,difficulty,target_exam,status) values ${questions};
 insert into public.question_answers(question_id,correct_answer,explanation) select id,'B','Fixture privada' from public.questions where id in (${ids});
 insert into private.simulations(id,title,question_count,published,free_access) values('${simIds[0]}','Fixture limites A',10,true,true),('${simIds[1]}','Fixture limites B',10,true,true);
 insert into private.practice_attempts(user_id,question_id,snapshot) select '${user}','${qIds[0]}','{}'::jsonb from generate_series(1,9);
 create function public.${fn}(p_nonce uuid,p_simulation uuid default null) returns jsonb language plpgsql security definer set search_path='' as $$
 declare value jsonb;
 begin
  perform pg_advisory_xact_lock(hashtextextended('${user}',23));
  update public.questions set status='published' where id in (${ids});
  if p_simulation is null then
   value:=public.start_question_practice_request('${user}','matematica','${topic}','easy','all',null,p_nonce);
  else
   if p_simulation not in ('${simIds[0]}'::uuid,'${simIds[1]}'::uuid) then raise exception 'invalid_input';end if;
   value:=public.start_simulation('${user}',p_simulation);
  end if;
  update public.questions set status='draft' where id in (${ids});
  return value;
 end;$$;
 revoke all on function public.${fn}(uuid,uuid) from public,anon,authenticated,service_role;
 grant execute on function public.${fn}(uuid,uuid) to service_role;
 notify pgrst,'reload schema';commit;`);
 created=true;
 // Não usar a função até o cache de schema reconhecê-la. Nenhuma cota é
 // consumida pela leitura do catálogo pg_proc feita pela CLI acima.
 let trials;
 for(let i=0;i<5;i++){
  trials=await Promise.all([rpc(fn,{p_nonce:randomUUID()}),rpc(fn,{p_nonce:randomUUID()})]);
  if(!trials.every(r=>r.error?.code==='PGRST202'))break;
  await new Promise(resolve=>setTimeout(resolve,1000));
 }
 assert.equal(trials.filter(r=>!r.error).length,1);
 assert.equal(trials.find(r=>r.error)?.error.message,'daily_practice_limit');
 const practice=await rpc('read_daily_limits',{p_user_id:user});assert.equal(practice.error,null);assert.equal(practice.data.practice.used,10);
 const sims=await Promise.all(simIds.map(id=>rpc(fn,{p_nonce:randomUUID(),p_simulation:id})));
 assert.equal(sims.filter(r=>!r.error).length,1);assert.equal(sims.find(r=>r.error)?.error.message,'daily_simulation_limit');
 const winner=sims[0].error?simIds[1]:simIds[0],state=sims.find(r=>!r.error).data;
 const resumes=await Promise.all([rpc('start_simulation',{p_user_id:user,p_simulation_id:winner}),rpc('start_simulation',{p_user_id:user,p_simulation_id:winner})]);
 resumes.forEach(r=>{assert.equal(r.error,null);assert.deepEqual(r.data,state);});
 const usage=await rpc('read_daily_limits',{p_user_id:user});assert.equal(usage.error,null);assert.equal(usage.data.simulations.used,1);
 query(`do $$begin if exists(select 1 from public.questions where id in (${ids}) and status<>'draft') then raise exception 'fixture published';end if;end$$;`);
 console.log('Concorrência aprovada: somente uma chamada usa a última questão e somente um novo simulado é criado. Retomar não gasta outra vaga.');
}finally{
 // Limpeza também se a configuração parcial falhar; o setup é transacional.
 query(`begin;
 drop function if exists public.${fn}(uuid,uuid);
 delete from auth.users where id='${user}';
 delete from private.simulations where id in ('${simIds[0]}','${simIds[1]}');
 delete from public.question_answers where question_id in (${ids});
 delete from public.questions where id in (${ids});
 do $$begin if exists(select 1 from auth.users where id='${user}') or exists(select 1 from public.questions where id in (${ids})) then raise exception 'cleanup failed';end if;end$$;
 notify pgrst,'reload schema';commit;`);
 rmSync(file,{force:true});
 console.log(created?'Usuário, tentativas, questões draft, modelos e função temporária removidos.':'Setup revertido e limpeza conferida.');
}
