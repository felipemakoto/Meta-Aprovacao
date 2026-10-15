import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {randomBytes} from 'node:crypto';import {encryptBackup,verifyBackup} from '../src/lib/operations/backup-crypto.ts';
test('cópia é criptografada e autenticada; corrupção e chave errada não passam',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'meta-backup-test-'));try{
  const file=path.join(directory,'copy.mapbackup'),key=randomBytes(32),source=Buffer.concat([Buffer.from('PGDMP-private-data'),randomBytes(4096)]);
  await encryptBackup((async function*(){yield source.subarray(0,10);yield source.subarray(10);})(),file,key);
  assert.deepEqual(await verifyBackup(file,key),{bytes:source.length});const encrypted=await readFile(file);assert.equal(encrypted.includes(Buffer.from('private-data')),false);
  await assert.rejects(verifyBackup(file,randomBytes(32)));encrypted[30]^=1;await writeFile(file,encrypted);await assert.rejects(verifyBackup(file,key));
 }finally{assert.equal(path.dirname(path.resolve(directory)),path.resolve(tmpdir()));assert.ok(path.basename(directory).startsWith('meta-backup-test-'));await rm(directory,{recursive:true});}
});
