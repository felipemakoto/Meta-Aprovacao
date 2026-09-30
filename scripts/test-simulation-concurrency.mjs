// Duas chamadas reais simultâneas, com fixtures privadas removidas no finally.
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
const user=randomUUID(),attempts=[randomUUID(),randomUUID()];
const file=path.join(dir,'simulation-concurrency-'+user+'.sql');
function query(sql){
 writeFileSync(file,sql);
 const r=spawnSync(process.execPath,[entry,'db','query','--linked','--file',file],{encoding:'utf8',timeout:60000,windowsHide:true});
 if(r.status!==0||r.error||r.stdout.includes('"_tag":"Error"'))throw Error('A consulta de fixture falhou; consulte o SQL temporário.');
}
const snapshots=Array.from({length:10},(_,i)=>({id:randomUUID(),position:i+1,version:1,subject:'matematica',topic:'Fixture',statement:'Concorrência',options:['1','2','3','4','5'],correctAnswer:'B',explanation:'Fixture privada'}));
const answers=snapshots.map(q=>({questionId:q.id,answer:'B'}));
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const submit=(id,answers)=>client.rpc('submit_simulation',{p_user_id:user,p_id:id,p_answers:answers}).abortSignal(AbortSignal.timeout(15000));
let cleaned=false;
try{
 query(`begin;
 insert into auth.users(id,email_confirmed_at) values('${user}',now());
 insert into private.simulation_attempts(id,user_id,simulation_id,title,snapshots)
 select ids.id::uuid,'${user}',s.id,'Fixture de concorrência','${JSON.stringify(snapshots)}'::jsonb
 from (values('${attempts[0]}'),('${attempts[1]}')) ids(id)
 cross join (select id from private.simulations order by id limit 1) s;
 do $$begin if (select count(*) from private.simulation_attempts where user_id='${user}')<>2 then raise exception 'missing fixture';end if;end$$;
 commit;`);
 const same=await Promise.all([submit(attempts[0],answers),submit(attempts[0],[...answers].reverse())]);
 same.forEach(r=>assert.equal(r.error,null));assert.deepEqual(same[0].data,same[1].data);
 const changed=answers.map((a,i)=>i===0?{...a,answer:'A'}:a);
 const conflict=await Promise.all([submit(attempts[1],answers),submit(attempts[1],changed)]);
 assert.equal(conflict.filter(r=>!r.error).length,1);assert.equal(conflict.find(r=>r.error)?.error.message,'already_submitted');
 const count=await client.rpc('simulation_summary',{p_user_id:user});assert.equal(count.error,null);assert.equal(count.data,2);
 console.log('Concorrência aprovada: mesmo envio retorna um resultado; envio diferente concorre com conflito.');
}finally{
 query(`begin; delete from auth.users where id='${user}'; do $$begin if exists(select 1 from private.simulation_attempts where user_id='${user}') then raise exception 'cleanup failed';end if;end$$;commit;`);
 cleaned=true;
 if(cleaned)rmSync(file,{force:true});
 console.log('Fixtures privadas e usuário de teste removidos. Nenhuma questão publicada.');
}
