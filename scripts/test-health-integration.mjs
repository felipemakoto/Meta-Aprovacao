import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {operationalHealth} from '../src/lib/subscriptions/health.ts';
try {
 const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??'');
 if(!/^https:\/\/[a-z0-9]{20}\.supabase\.co\/$/.test(url.href)||!process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_')||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_'))throw Error();
 const options={auth:{persistSession:false,autoRefreshToken:false}};
 const admin=createClient(url.origin,process.env.SUPABASE_SECRET_KEY,options);
 const anon=createClient(url.origin,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
 const allowed=await admin.rpc('cakto_operational_health').abortSignal(AbortSignal.timeout(5000));
 assert.equal(allowed.error,null);const h=operationalHealth(allowed.data);assert.equal(h.monitor.active,true);assert.notEqual(h.monitor.lastCheckedAt,null);
 const blocked=await anon.rpc('cakto_operational_health').abortSignal(AbortSignal.timeout(5000));
 assert.equal(blocked.data,null);assert.ok(blocked.error);assert.ok(['42501','PGRST202'].includes(blocked.error.code));
 console.log('Integração aprovada: leitura administrativa válida e consulta anônima bloqueada. Nenhum dado alterado.');
}catch{console.error('Integração não concluída. Confira as permissões e o monitor; nenhuma credencial foi exibida.');process.exitCode=1;}
