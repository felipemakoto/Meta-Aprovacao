import {createClient} from '@supabase/supabase-js';
import {readinessReport} from '../src/lib/subscriptions/readiness.ts';
try {
 const url=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL??'');
 if(!/^https:\/\/[a-z0-9]{20}\.supabase\.co\/$/.test(url.href)||!process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_'))throw Error();
 if(process.argv.slice(2).some(v=>v!=='--json')||process.argv.length>3)throw Error();
 const admin=createClient(url.origin,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await admin.rpc('cakto_launch_readiness').abortSignal(AbortSignal.timeout(5000));if(error)throw Error();
 const report=readinessReport(data,process.env);console.log(process.argv.includes('--json')?JSON.stringify(report.data):report.text);
 process.exitCode=2; // Reading succeeds, but the tool never certifies release approval.
}catch{console.error('Checagem indisponível. Confira configuração e migrations; nenhuma credencial foi exibida.');process.exitCode=1;}
