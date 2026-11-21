// Administrative access transitions for the exact disposable browser fixture only.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {createClient} from '@supabase/supabase-js';
const action=process.argv[2];assert.ok(['grant','revoke'].includes(action));
const fixture=JSON.parse(readFileSync(path.join(process.env.TEMP,'meta-account-browser-fixture.json'),'utf8'));
assert.equal(fixture.origin,'http://127.0.0.1:3000');const uuid=/^[a-f0-9-]{36}$/;assert.ok(uuid.test(fixture.id)&&uuid.test(fixture.fixtureTag));assert.match(fixture.email,/^account-smoke-[a-f0-9-]{36}@example\.invalid$/);
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false}}),check=await admin.auth.admin.getUserById(fixture.id);
assert.equal(check.error,null);assert.equal(check.data.user.email,fixture.email);assert.equal(check.data.user.app_metadata.account_profile_fixture,fixture.fixtureTag);
const expected=action==='grant'?'true':'false';
const mutation=action==='grant'?`insert into private.complimentary_premium(user_id,access_until,reason) values('${fixture.id}',clock_timestamp()+interval '10 minutes','settings-fixture-${fixture.fixtureTag}') on conflict(user_id) do update set access_from=clock_timestamp(),access_until=clock_timestamp()+interval '10 minutes',revoked_at=null,reason=excluded.reason;`:`update private.complimentary_premium set revoked_at=clock_timestamp() where user_id='${fixture.id}' and reason='settings-fixture-${fixture.fixtureTag}';`;
const sql=`do $$begin if not exists(select 1 from auth.users where id='${fixture.id}' and raw_app_meta_data->>'account_profile_fixture'='${fixture.fixtureTag}') then raise exception 'fixture_mismatch';end if;${mutation} if private.subscription_access('${fixture.id}')->>'hasPremium'<>'${expected}' then raise exception 'fixture_access';end if;end$$;select 'test_access_passed' as status;`;
const require=createRequire(import.meta.url),pkg=require.resolve('supabase/package.json'),cli=path.resolve(path.dirname(pkg),require(pkg).bin.supabase),file=path.resolve('supabase/.temp/settings-grant-'+fixture.id+'.sql');
try{writeFileSync(file,sql);const r=spawnSync(process.execPath,[cli,'db','query','--linked','--file',file,'-o','json'],{encoding:'utf8',windowsHide:true,timeout:45000});assert.equal(r.status,0);assert.ok(r.stdout.includes('test_access_passed'));console.log(action==='grant'?'Acesso temporário confirmado somente na fixture. Nenhum pagamento criado.':'Downgrade da fixture confirmado. Dados de estudo preservados.');}finally{rmSync(file,{force:true});}
