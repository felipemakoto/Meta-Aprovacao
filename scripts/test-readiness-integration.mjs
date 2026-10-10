import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {launchReadiness} from '../src/lib/subscriptions/readiness.ts';
try {
 const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??'');
 if(!/^https:\/\/[a-z0-9]{20}\.supabase\.co\/$/.test(url.href)||!process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_')||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_'))throw Error();
 const options={auth:{persistSession:false,autoRefreshToken:false}};
 const admin=createClient(url.origin,process.env.SUPABASE_SECRET_KEY,options),anon=createClient(url.origin,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,options);
 const allowed=await admin.rpc('cakto_launch_readiness').abortSignal(AbortSignal.timeout(5000));assert.equal(allowed.error,null);
 const r=launchReadiness(allowed.data,process.env);assert.equal(r.launchApproved,false);assert.equal(r.checkoutEnabled,false);
 const denied=await anon.rpc('cakto_launch_readiness').abortSignal(AbortSignal.timeout(5000));assert.equal(denied.data,null);assert.ok(denied.error);assert.ok(['42501','PGRST202'].includes(denied.error.code));
 console.log('Integração aprovada: agregado administrativo validado, cliente anônimo bloqueado e checkout preservado. Nenhum dado alterado.');
}catch{console.error('Integração não concluída. Confira configuração e permissões; nenhuma credencial foi exibida.');process.exitCode=1;}
