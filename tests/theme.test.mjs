import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {parseTheme,resolvedTheme,themeBootstrap} from '../src/lib/account/theme.ts';
test('tema aceita apenas preferências conhecidas e resolve a opção automática',()=>{
 for(const value of ['light','dark','system'])assert.equal(parseTheme(value),value);
 for(const value of [null,undefined,'<script>','admin',{},''])assert.equal(parseTheme(value),'light');
 assert.equal(resolvedTheme('system',true),'dark');assert.equal(resolvedTheme('system',false),'light');assert.equal(resolvedTheme('light',true),'light');assert.equal(resolvedTheme('dark',false),'dark');
});
test('inicialização usa código estático, lê somente a preferência e não interpola o conteúdo armazenado',()=>{
 for(const [value,dark,expected] of [['dark',false,'dark'],['light',true,'light'],['system',true,'dark'],['system',false,'light'],['</script><script>attack()</script>',true,'light']]){
  const dataset={};vm.runInNewContext(themeBootstrap,{document:{documentElement:{dataset}},localStorage:{getItem:()=>value},matchMedia:()=>({matches:dark})});assert.equal(dataset.theme,expected);
 }
 const dataset={};vm.runInNewContext(themeBootstrap,{document:{documentElement:{dataset}},localStorage:{getItem:()=>{throw Error();}}});assert.equal(dataset.theme,'light');
});
