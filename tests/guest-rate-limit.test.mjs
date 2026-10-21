import test from 'node:test';
import assert from 'node:assert/strict';
import {guestClientHash} from '../src/lib/quiz/guest-rate-limit.ts';
test('identificador de rede não armazena IP e ignora cabeçalhos não confiáveis',()=>{
 const request=headers=>new Request('https://app.example',{headers});const secret='a'.repeat(64);
 const hash=guestClientHash(request({'x-vercel-forwarded-for':'192.0.2.1'}),secret,true);
 assert.match(hash,/^[a-f0-9]{64}$/);assert.ok(!hash.includes('192.0.2.1'));
 assert.notEqual(hash,guestClientHash(request({'x-vercel-forwarded-for':'192.0.2.2'}),secret,true));
 assert.notEqual(hash,guestClientHash(request({'x-vercel-forwarded-for':'192.0.2.1'}),'b'.repeat(64),true));
 assert.equal(guestClientHash(request({'x-forwarded-for':'192.0.2.1'}),secret,true),guestClientHash(request({}),secret,true));
 assert.equal(guestClientHash(request({'x-vercel-forwarded-for':'192.0.2.1'}),secret,false),guestClientHash(request({}),secret,false));
 assert.equal(guestClientHash(request({'x-vercel-forwarded-for':'invalid'}),secret,true),guestClientHash(request({}),secret,true));
 assert.throws(()=>guestClientHash(request({}),'',true));
});
