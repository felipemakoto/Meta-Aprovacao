import path from 'node:path';
import {readFile, writeFile, mkdir, rename, unlink} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {backupKey, latestManifest, operationsDirectory} from './operations-local.mjs';
import {backupKeyId} from '../src/lib/operations/recovery-key.ts';
import {verifyBackup} from '../src/lib/operations/backup-crypto.ts';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const configFile = path.join(operationsDirectory, 'offsite-config.json');
const receiptFile = path.join(operationsDirectory, 'latest-offsite.json');
async function optionalJson(file) {try {return JSON.parse(await readFile(file, 'utf8'));} catch (e) {if (e.code === 'ENOENT') return null; throw e;}}
async function atomicJson(file, value) {const temporary = file + '.' + randomUUID(); await writeFile(temporary, JSON.stringify(value, null, 2), {flag: 'wx', mode: 0o600}); await rename(temporary, file);}
async function immutableFile(file, bytes) {try {await writeFile(file, bytes, {flag: 'wx', mode: 0o600});} catch (e) {if (e.code !== 'EEXIST' || hash(await readFile(file)) !== hash(bytes)) throw e;}}
let key;
try {
  const config = await optionalJson(configFile);
  if (config?.provider !== 'google-drive' || !/^[A-Za-z0-9_-]{10,200}$/.test(config.folderId)) throw Error();
  if (process.argv[2] === 'failed') {
    await atomicJson(path.join(operationsDirectory, 'offsite-failed.json'), {failedAt: new Date().toISOString()});
    console.log(JSON.stringify({failureRecorded: true}));
    process.exit(0);
  }
  const manifest = await latestManifest();
  if (!manifest?.verified || typeof manifest.file !== 'string' || path.basename(manifest.file) !== manifest.file) throw Error();
  const archive = path.join(operationsDirectory, 'backups', manifest.file);
  const archiveBytes = await readFile(archive);
  if (hash(archiveBytes) !== manifest.sha256) throw Error();
  key = await backupKey();
  await verifyBackup(archive, key);
  const envelopeFile = path.join(operationsDirectory, 'recovery-key-v1.json');
  const envelope = await optionalJson(envelopeFile), proof = await optionalJson(path.join(operationsDirectory, 'recovery-check.json'));
  if (!envelope || !proof) {
    console.log(JSON.stringify({action: 'recovery_setup_needed', message: 'Conclua o formulário de recuperação antes de enviar o conjunto ao Drive.'}));
  } else {
    const envelopeBytes = await readFile(envelopeFile), envelopeHash = hash(envelopeBytes);
    if (envelope.keyId !== backupKeyId(key) || proof.keyId !== envelope.keyId || proof.envelopeSha256 !== envelopeHash) throw Error();
    const directory = path.join(operationsDirectory, 'exports');
    await mkdir(directory, {recursive: true});
    const snapshot = {formatVersion: manifest.formatVersion, accessPrivilegesIncluded: manifest.accessPrivilegesIncluded, createdAt: manifest.createdAt, projectRef: manifest.projectRef, file: manifest.file, sha256: manifest.sha256, bytes: manifest.bytes, objects: manifest.objects, verified: true, schemas: manifest.schemas, storageObjects: false, recoveryKeyId: envelope.keyId};
    const manifestBytes = Buffer.from(JSON.stringify(snapshot, null, 2));
    const manifestPath = path.join(directory, manifest.file + '.manifest.json');
    const envelopePath = path.join(directory, 'recovery-key-' + envelopeHash.slice(0, 16) + '.json');
    await immutableFile(manifestPath, manifestBytes);
    await immutableFile(envelopePath, envelopeBytes);
    const previous = await optionalJson(receiptFile);
    const files = [[archive, archiveBytes], [manifestPath, manifestBytes], [envelopePath, envelopeBytes]].map(([file, bytes]) => {
      const sha256 = hash(bytes), fileName = path.basename(file);
      const existing = previous?.files?.find(item => item.fileName === fileName && item.sha256 === sha256);
      return {filePath: file, fileName, size: bytes.length, sha256, mimeType: file === archive ? 'application/octet-stream' : 'application/json', ...(existing ? {previousDriveId: existing.driveId} : {})};
    });
    const mode = process.argv[2] ?? 'prepare';
    if (mode === 'prepare') {
      console.log(JSON.stringify({action: previous?.archiveSha256 === manifest.sha256 && previous?.recoverySha256 === envelopeHash ? 'unchanged' : 'upload', folderId: config.folderId, archiveSha256: manifest.sha256, recoverySha256: envelopeHash, files}));
    } else if (mode === 'acknowledge') {
      const receipt = await optionalJson(path.join(operationsDirectory, 'offsite-pending-receipt.json'));
      if (receipt?.folderId !== config.folderId || receipt.archiveSha256 !== manifest.sha256 || !Array.isArray(receipt.files) || receipt.files.length !== files.length) throw Error();
      for (const file of files) {
        const uploaded = receipt.files.filter(item => item.fileName === file.fileName);
        if (uploaded.length !== 1 || uploaded[0].sha256 !== file.sha256 || uploaded[0].size !== file.size || uploaded[0].shared !== false || !/^[A-Za-z0-9_-]{10,200}$/.test(uploaded[0].driveId)) throw Error();
      }
      await atomicJson(receiptFile, {checkedAt: new Date().toISOString(), backupCreatedAt: manifest.createdAt, archiveSha256: manifest.sha256, recoverySha256: envelopeHash, folderId: config.folderId, files: receipt.files});
      await atomicJson(configFile, {...config, enabled: true});
      await unlink(path.join(operationsDirectory, 'offsite-failed.json')).catch(error => {if (error.code !== 'ENOENT') throw error;});
      console.log(JSON.stringify({acknowledged: true, files: files.length, private: true}));
    } else throw Error();
  }
} catch {
  console.error('Cópia externa não confirmada. Nenhum segredo foi exibido nem arquivo existente substituído.');
  process.exitCode = 1;
} finally {key?.fill(0);}
