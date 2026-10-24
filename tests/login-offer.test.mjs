import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import Module,{createRequire} from 'node:module';
import ts from 'typescript';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parseAccountProfile} from '../src/lib/account/contract.ts';
import {parseSubscriptionAccess} from '../src/lib/subscriptions/contract.ts';

// Render the actual page and client component, replacing only server services and CSS.
function loadTsx(relative,dependencies={}) {
 const filename=fileURLToPath(new URL(relative,import.meta.url));
 const require=createRequire(filename),mod=new Module(filename);
 mod.filename=filename;
 mod.require=name=>Object.hasOwn(dependencies,name)?dependencies[name]:name.endsWith('.css')?new Proxy({},{get:(_,key)=>key==='__esModule'?false:String(key)}):require(name);
 mod._compile(ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
 return mod.exports.default;
}
const AccountPanel=loadTsx('../src/app/login/account-profile.tsx',{'@/lib/account/contract':{parseAccountProfile},'@/lib/account/preferences':{applyMotionPreference:()=>{}},'../analytics':{AnalyticsPreferences:()=>null}});
const LoginForm=loadTsx('../src/app/login/login-form.tsx',{'../google-auth-button':{__esModule:true,default:()=>null},'./account-profile':{__esModule:true,default:AccountPanel}});
const verified={id:'verified-owner',email_confirmed_at:'2026-10-01T12:00:00Z'};
async function render({user=verified,access={hasPremium:false,accessUntil:null},authFailure=false,readFailure=false}={}) {
 const reads=[];
 const Page=loadTsx('../src/app/login/page.tsx',{
  '@/lib/auth/user':{getVerifiedUser:async()=>{if(authFailure)throw Error('private-auth-error');return user;}},
  '@/lib/data/subscriptions':{readSubscriptionAccess:async id=>{reads.push(id);if(readFailure)throw Error('private-read-error');return access;}},
  '@/lib/subscriptions/contract':{parseSubscriptionAccess},
  './login-form':{__esModule:true,default:LoginForm},
 });
 return {html:renderToStaticMarkup(await Page()),reads};
}

test('oferta aparece para conta gratuita verificada e usa a identidade do servidor',async()=>{
 const {html,reads}=await render();assert.deepEqual(reads,[verified.id]);
 assert.match(html,/href="\/premium"/);assert.match(html,/Desbloquear Premium/);assert.doesNotMatch(html,/Mudar de plano/);
 assert.match(html,/href="\/simulados"/);assert.doesNotMatch(html,/verified-owner|accessUntil/);
});
test('conta Premium mantém estudos e simulado sem botão de compra',async()=>{
 const {html}=await render({access:{hasPremium:true,accessUntil:'2026-11-02T15:00:00Z'}});
 assert.doesNotMatch(html,/href="\/premium"|Desbloquear Premium/);
 for(const label of ['Meus estudos','Fazer um simulado','Sair da conta'])assert.ok(html.includes(label));
});
test('visitante não consulta assinatura nem recebe oferta de conta autenticada',async()=>{
 const {html,reads}=await render({user:null});assert.deepEqual(reads,[]);
 assert.match(html,/id="login-email"/);assert.doesNotMatch(html,/Desbloquear Premium/);
});
test('conta sem confirmação não é presumida gratuita para mostrar a oferta',async()=>{
 const {html,reads}=await render({user:{...verified,email_confirmed_at:null}});assert.deepEqual(reads,[]);
 assert.match(html,/Meus estudos/);assert.doesNotMatch(html,/Desbloquear Premium/);
});
test('falha ou resposta inválida do plano oculta oferta sem impedir ações da conta',async()=>{
 for(const setup of [{readFailure:true},{access:null},{access:{provider_status:'active'}},{access:{hasPremium:'false',accessUntil:null}}]){
  const {html}=await render(setup);assert.match(html,/Meus estudos/);assert.match(html,/Sair da conta/);
  assert.doesNotMatch(html,/Desbloquear Premium|private-read-error/);
 }
});
test('falha de autenticação mantém recuperação da tela, sem consultar plano',async()=>{
 const {html,reads}=await render({authFailure:true});assert.deepEqual(reads,[]);
 assert.match(html,/Tentar novamente/);assert.doesNotMatch(html,/Desbloquear Premium|private-auth-error/);
});
test('props ausentes ou visitante não exibem oferta por padrão',()=>{
 for(const props of [{signedIn:true},{signedIn:false,showPremiumOffer:true}])assert.doesNotMatch(renderToStaticMarkup(createElement(LoginForm,props)),/Desbloquear Premium/);
});


test('minha conta oferece perfil e configurações sem o aviso antigo de sessão',async()=>{
 const {html}=await render();assert.match(html,/Minha conta/);
 for(const label of ['Alterar foto','Nickname','Configurações do perfil','Reduzir animações','Histórico de estudos','Minhas estatísticas'])assert.ok(html.includes(label));
 assert.doesNotMatch(html,/Sua sessão está ativa neste navegador/);
 const guest=await render({user:null});assert.doesNotMatch(guest.html,/Configurações do perfil|Alterar foto/);
});
