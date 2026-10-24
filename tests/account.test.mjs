import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {parseAccountCommand,parseAccountProfile} from '../src/lib/account/contract.ts';
import {prepareAvatar} from '../src/lib/account/avatar.ts';
import {accountHandlers} from '../src/lib/account/http.ts';
const origin='https://account.example',profile={nickname:'Felipe',reduceMotion:false,avatarVersion:null,theme:'light'};
const request=(body,headers={},query='')=>new Request(origin+'/api/account/profile'+query,{method:'POST',headers:{origin,'content-type':'application/json',...headers},body:JSON.stringify(body)});
const fail=async()=>assert.fail('Operação indevida');
const handlers=(overrides={})=>accountHandlers({user:async()=>'owner-a',read:async()=>profile,avatar:async()=>null,reserve:async()=>{},execute:async()=>profile,...overrides},{origin,secure:true});
test('perfil valida nickname e preferências; não aceita identidade, permissões, URLs ou campos extras',()=>{
 assert.deepEqual(parseAccountCommand({action:'save',nickname:'  João_2  ',reduceMotion:true}),{action:'save',nickname:'João_2',reduceMotion:true});
 for(const nickname of ['<script>','a','a'.repeat(33),'User@Email','Nome\nOutro'])assert.throws(()=>parseAccountCommand({action:'save',nickname,reduceMotion:false}));
 for(const value of [{action:'save',nickname:'Felipe',reduceMotion:false,userId:'victim'},{action:'avatar',image:'https://example.com/a.png'},{action:'avatar',image:'data:image/svg+xml,evil'},{action:'save',nickname:'Felipe',reduceMotion:'false'},{action:'remove_avatar',hasPremium:true}])assert.throws(()=>parseAccountCommand(value));
 assert.deepEqual(parseAccountProfile(profile),profile);assert.throws(()=>parseAccountProfile({...profile,avatarVersion:'javascript:alert(1)'}));
});
test('foto é reencodificada para WebP 256px sem EXIF; SVG, HTML e arquivos falsos são recusados',async()=>{
 const image=await sharp({create:{width:400,height:300,channels:3,background:'#237b38'}}).jpeg().withMetadata({exif:{IFD0:{Artist:'Private metadata'}}}).toBuffer();
 const result=Buffer.from(await prepareAvatar(image.toString('base64')),'base64'),meta=await sharp(result).metadata();
 assert.equal(meta.format,'webp');assert.equal(meta.width,256);assert.equal(meta.height,256);assert.equal(meta.exif,undefined);assert.ok(result.length<=131072);
 for(const bytes of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'),Buffer.from('<html>evil</html>'),Buffer.from('RIFFxxxxWEBPnot-an-image')])await assert.rejects(()=>prepareAvatar(bytes.toString('base64')),/invalid_image/);
 await assert.rejects(()=>prepareAvatar(Buffer.alloc(2097153).toString('base64')),/upload_too_large/);
});
test('API exige dono verificado, nega IDOR/CSRF e bloqueia antes de processar imagem quando não há cota',async()=>{
 const command={action:'save',nickname:'Aluno',reduceMotion:true};
 assert.equal((await handlers({user:async()=>null,read:fail}).GET(new Request(origin+'/api/account/profile'))).status,401);
 assert.equal((await handlers({user:async()=>null,execute:fail}).POST(request(command))).status,401);
 assert.equal((await handlers({execute:fail}).POST(request(command,{origin:'https://evil.example'}))).status,403);
 assert.equal((await handlers({execute:fail}).POST(request({...command,userId:'owner-b'}))).status,400);
 assert.equal((await handlers({read:fail}).GET(new Request(origin+'/api/account/profile?userId=owner-b'))).status,400);
 assert.equal((await handlers({reserve:async()=>{throw Error('rate_limited');},execute:fail}).POST(request(command))).status,429);
 let received;const r=await handlers({execute:async(user,input)=>{received={user,input};return profile;}}).POST(request(command));
 assert.equal(r.status,200);assert.deepEqual(received,{user:'owner-a',input:command});assert.match(r.headers.get('cache-control'),/private.*no-store/);
});
test('avatar é privado, não aceita selecionar outro usuário e erros não vazam detalhes',async()=>{
 assert.equal((await handlers({avatar:fail,user:async()=>null}).AVATAR(new Request(origin+'/api/account/avatar'))).status,401);
 assert.equal((await handlers({avatar:fail}).AVATAR(new Request(origin+'/api/account/avatar?userId=owner-b'))).status,400);
 const r=await handlers({avatar:async()=>Buffer.from('RIFFxxxxWEBP').toString('base64')}).AVATAR(new Request(origin+'/api/account/avatar'));
 assert.equal(r.headers.get('content-type'),'image/webp');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.match(r.headers.get('cache-control'),/private.*no-store/);
 const error=await handlers({read:async()=>{throw Error('private-secret');}}).GET(new Request(origin+'/api/account/profile'));assert.equal(error.status,503);assert.doesNotMatch(await error.text(),/secret/);
});


test('tema aceita somente claro, escuro ou sistema sem tornar o plano editável',()=>{
 const saved={action:'save',nickname:'Aluno',reduceMotion:false,theme:'dark'};assert.deepEqual(parseAccountCommand(saved),saved);
 for(const theme of ['light','dark','system'])assert.equal(parseAccountProfile({...profile,theme}).theme,theme);
 for(const theme of ['admin','javascript:alert(1)',null])assert.throws(()=>parseAccountCommand({...saved,theme}));
 assert.throws(()=>parseAccountCommand({...saved,plan:'premium'}));
 assert.equal(parseAccountProfile({nickname:'Aluno',reduceMotion:false,avatarVersion:null}).theme,'light');
});
