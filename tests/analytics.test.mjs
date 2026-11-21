import test from 'node:test';
import assert from 'node:assert/strict';
import {analyticsId,analyticsPath,parseAnalyticsChoice} from '../src/lib/analytics.ts';
test('medição usa o ID solicitado e remove parâmetros, fragmentos e identificadores privados',()=>{
 assert.equal(analyticsId,'G-PMGG1W3N6N');
 for(const page of ['/','/premium','/login','/cadastro','/dashboard','/privacidade'])assert.equal(analyticsPath(page+'?email=private@example.invalid&code=secret#access_token=hidden'),page);
 assert.equal(analyticsPath('/historico/practice/private-id?key=secret'),'/historico/atividade');
 assert.equal(analyticsPath('/simulados/private-id'),'/simulados/atividade');
 assert.equal(analyticsPath('/auth/google/callback?code=secret'),'/auth');
 assert.equal(analyticsPath('/recuperacao/secret-token'),'/outra-pagina');
 assert.equal(analyticsPath('/private@example.invalid'),'/outra-pagina');
});
test('consentimento exige escolha válida, versão atual e prazo; ausência ou erro nunca autoriza',()=>{
 const now=Date.parse('2026-10-22T15:00:00Z');
 for(const choice of ['accepted','rejected'])assert.equal(parseAnalyticsChoice(JSON.stringify({version:1,choice,at:now}),now),choice);
 for(const value of [null,'','invalid','null','[]','{}',JSON.stringify({version:1,choice:true,at:now}),JSON.stringify({version:2,choice:'accepted',at:now}),JSON.stringify({version:1,choice:'accepted',at:now+1}),JSON.stringify({version:1,choice:'accepted',at:now-180*86400000})])assert.equal(parseAnalyticsChoice(value,now),null);
});
