import path from 'node:path';
import {readFile, writeFile, stat} from 'node:fs/promises';
import {timingSafeEqual, createHash} from 'node:crypto';
import {backupKey, latestManifest, operationsDirectory} from './operations-local.mjs';
import {sealRecoveryKey, openRecoveryKey, backupKeyId} from '../src/lib/operations/recovery-key.ts';
import {verifyBackup} from '../src/lib/operations/backup-crypto.ts';
import {promptRecoveryPassword} from './recovery-password.mjs';

let key, recovered;
try {
  if (process.argv.length !== 2) throw Error();
  key = await backupKey();
  const file = path.join(operationsDirectory, 'recovery-key-v1.json');
  let exists = false;
  try {exists = (await stat(file)).isFile();} catch (error) {if (error.code !== 'ENOENT') throw error;}
  const password = await promptRecoveryPassword(!exists);
  const envelope = exists ? JSON.parse(await readFile(file, 'utf8')) : await sealRecoveryKey(key, password);
  recovered = await openRecoveryKey(envelope, password);
  if (!timingSafeEqual(key, recovered)) throw Error();
  const manifest = await latestManifest();
  if (!manifest?.verified || path.basename(manifest.file) !== manifest.file) throw Error();
  await verifyBackup(path.join(operationsDirectory, 'backups', manifest.file), recovered);
  if (!exists) await writeFile(file, JSON.stringify(envelope, null, 2), {flag: 'wx', mode: 0o600});
  await writeFile(path.join(operationsDirectory, 'recovery-check.json'), JSON.stringify({checkedAt: new Date().toISOString(), keyId: backupKeyId(key), envelopeSha256: createHash('sha256').update(await readFile(file)).digest('hex'), archiveSha256: manifest.sha256}), {mode: 0o600});
  console.log(JSON.stringify({recoveryKeyProtected: true, existingFilePreserved: exists, passwordRoundTripPassed: true, archiveVerifiedWithRecoveryKey: true, keyId: backupKeyId(key), file}));
} catch {
  console.error('Recuperação não concluída. Nenhuma senha ou chave foi exibida e nenhum arquivo existente foi substituído.');
  process.exitCode = 1;
} finally {key?.fill(0); recovered?.fill(0);}
