// Disposable marked accounts only. No email, checkout or payment-provider calls.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {writeFileSync,existsSync,rmSync} from 'node:fs';
import path from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {createClient} from '@supabase/supabase-js';
import sharp from 'sharp';
const origin=process.env.ACCOUNT_TEST_ORIGIN??'https://meta-aprovacao.vercel.app';
assert.ok(['https://meta-aprovacao.vercel.app','http://127.0.0.1:3085'].includes(origin));
const tag=randomUUID(),admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const fixtures=[],handoff=path.join(process.env.TEMP,'meta-account-browser-fixture.json'),done=handoff+'.done';
async function request(account,route,body,status=200){
 const headers={Origin:origin,...(account?{Cookie:[...account.jar].map(([k,v])=>`${k}=${v}`).join('; ')}:{})};if(body)headers['Content-Type']='application/json';
 const r=await fetch(origin+route,{method:body?'POST':'GET',headers,redirect:'manual',signal:AbortSignal.timeout(30000),...(body?{body:JSON.stringify(body)}:{})});
 if(account)for(const cookie of r.headers.getSetCookie()){const pair=cookie.split(';')[0],i=pair.indexOf('=');account.jar.set(pair.slice(0,i),pair.slice(i+1));}
 assert.equal(r.status,status,`Unexpected status for ${route}`);return r;
}
async function create(){
 const item={email:`account-smoke-${randomUUID()}@example.invalid`,password:randomBytes(32).toString('base64url'),jar:new Map()};
 const result=await admin.auth.admin.createUser({email:item.email,password:item.password,email_confirm:true,app_metadata:{account_profile_fixture:tag}});
 assert.equal(result.error,null);item.id=result.data.user.id;fixtures.push(item);await request(item,'/api/auth/login',{email:item.email,password:item.password});return item;
}
try{
 const a=await create(),b=await create();
 await request(null,'/api/account/profile',undefined,401);await request(null,'/api/account/avatar',undefined,401);
 const initial=await(await request(a,'/api/account/profile')).json();assert.equal(initial.nickname,'');assert.equal(initial.avatarVersion,null);
 await request(a,'/api/account/profile',{action:'save',nickname:'Perfil de teste',reduceMotion:true});
 const image=await sharp({create:{width:400,height:300,channels:3,background:'#237b38'}}).png().toBuffer();
 const updated=await(await request(a,'/api/account/profile',{action:'avatar',image:image.toString('base64')})).json();assert.ok(updated.avatarVersion);assert.equal(updated.nickname,'Perfil de teste');assert.equal(updated.reduceMotion,true);
 const avatar=await request(a,'/api/account/avatar?v='+updated.avatarVersion);assert.equal(avatar.headers.get('content-type'),'image/webp');assert.match(avatar.headers.get('cache-control'),/private.*no-store/);
 const meta=await sharp(Buffer.from(await avatar.arrayBuffer())).metadata();assert.equal(meta.width,256);assert.equal(meta.height,256);assert.equal(meta.exif,undefined);
 assert.equal((await(await request(b,'/api/account/profile')).json()).nickname,'');await request(b,'/api/account/avatar',undefined,404);
 await request(b,'/api/account/profile?userId='+a.id,undefined,400);
 await request(b,'/api/account/profile',{action:'save',nickname:'Invalid',reduceMotion:false,userId:a.id},400);
 await request(a,'/api/account/profile',{action:'avatar',image:Buffer.from('<svg/>').toString('base64')},422);
 await request(a,'/api/account/profile',{action:'remove_avatar'});await request(a,'/api/account/avatar',undefined,404);
 await request(a,'/api/account/profile',{action:'save',nickname:'Perfil de teste',reduceMotion:false});
 await request(a,'/api/account/profile',{action:'avatar',image:image.toString('base64')});
 console.log('HTTP aprovado: perfil gratuito, foto real reencodificada, preferências, remoção, isolamento e validação.');
 if(process.argv.includes('--browser')){
  rmSync(done,{force:true});writeFileSync(handoff,JSON.stringify({email:a.email,password:a.password,origin}));
  console.log('Conta temporária pronta para conferência visual; limpeza automática em até 15 minutos.');
  for(let n=0;n<450&&!existsSync(done);n++)await delay(2000);
 }
}catch{
 console.error('Conferência HTTP não aprovada. Nenhuma credencial foi exibida.');process.exitCode=1;
}finally{
 for(const item of fixtures){
  const check=await admin.auth.admin.getUserById(item.id);
  if(check.data.user?.app_metadata?.account_profile_fixture!==tag){console.error('Limpeza bloqueada: identificação da conta não confere.');process.exitCode=1;continue;}
  const removed=await admin.auth.admin.deleteUser(item.id);if(removed.error){console.error('Não foi possível remover uma conta temporária.');process.exitCode=1;continue;}
  if((await admin.auth.admin.getUserById(item.id)).data.user){console.error('Ausência de conta temporária não confirmada.');process.exitCode=1;}
 }
 rmSync(handoff,{force:true});rmSync(done,{force:true});
 if(!process.exitCode)console.log('Contas temporárias removidas; ausência conferida.');
}
