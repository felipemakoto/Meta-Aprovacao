import path from 'node:path';
import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {createReadStream} from 'node:fs';
import {mkdir, writeFile, unlink, rm, rename, stat} from 'node:fs/promises';
import {spawn, spawnSync} from 'node:child_process';
import {createServer} from 'node:net';
import {Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {backupKey, latestManifest, operationsDirectory} from './operations-local.mjs';
import {decryptBackup, verifyBackup} from '../src/lib/operations/backup-crypto.ts';
import {copyFingerprints, matchingCopies, restoreTarget, restoreInput} from '../src/lib/operations/restore-check.ts';
import {openRecoveryKey} from '../src/lib/operations/recovery-key.ts';
import {promptRecoveryPassword} from './recovery-password.mjs';
import {readFile} from 'node:fs/promises';

const tools = path.join(process.env.LOCALAPPDATA, 'MetaAprovacao', 'tools', 'postgresql-18.6');
const bin = path.join(tools, 'bin');
const base = path.join(operationsDirectory, 'drills');
const id = randomUUID();
let directory, target, server, key;
let phase = 'preparation';
let result = null;
let cleanup = false;
let localIssue;

// Child processes receive only local connection settings, never production credentials.
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) =>
  ['SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'PATH', 'COMSPEC'].includes(name.toUpperCase())));
Object.assign(env, {PGCONNECT_TIMEOUT: '2', PGSSLMODE: 'disable', PGCLIENTENCODING: 'UTF8'});

async function command(executable, args, {input, timeout = 60000, allowEarlyClose = false} = {}) {
  const child = spawn(path.join(bin, executable + '.exe'), args, {env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
  const chunks = [];
  let size = 0;
  child.stdout.on('data', chunk => {
    size += chunk.length;
    if (size > 128 * 1024 * 1024) child.kill();
    else chunks.push(chunk);
  });
  // Never print SQL, row values, paths from provider errors, or statement text.
  child.stderr.on('data', chunk => {
    const text = chunk.toString();
    const missingRole = text.match(/role "([a-z_]+)" does not exist/);
    if (missingRole) localIssue = {missingRole: missingRole[1]};
    else if (text.includes('permission denied')) localIssue = {permissionDenied: true};
  });
  const ended = new Promise((resolve, reject) => {
    child.on('error', () => reject(Error('client_unavailable')));
    child.on('close', code => code === 0 && size <= 128 * 1024 * 1024 ? resolve() : reject(Error('local_command_failed')));
  });
  const timer = setTimeout(() => child.kill(), timeout);
  try {
    const sent = input ? pipeline(Readable.from(input), child.stdin) : Promise.resolve(child.stdin.end());
    const outcomes = await Promise.allSettled([ended, sent]);
    if (outcomes[0].status === 'rejected') throw Error('local_command_failed');
    if (outcomes[1].status === 'rejected' && !(allowEarlyClose && ['EPIPE', 'ERR_STREAM_PREMATURE_CLOSE'].includes(outcomes[1].reason?.code))) throw Error('local_input_failed');
    return Buffer.concat(chunks).toString('utf8');
  } finally {
    clearTimeout(timer);
    child.kill();
  }
}

function localArgs() {
  return ['--host=' + target.host, '--port=' + target.port, '--username=' + target.user, '--dbname=' + target.database, '--no-password'];
}

async function query(sql) {
  return command('psql', [...localArgs(), '--no-psqlrc', '--quiet', '--tuples-only', '--no-align', '--set=ON_ERROR_STOP=1'], {input: [Buffer.from(sql)]});
}

async function randomPort() {
  const socket = createServer();
  const port = 49152 + randomBytes(2).readUInt16BE() % 16384;
  try {
    await new Promise((resolve, reject) => {socket.once('error', reject); socket.listen(port, '127.0.0.1', resolve);});
    await new Promise(resolve => socket.close(resolve));
    return port;
  } catch { return randomPort(); }
}

async function clean() {
  if (!directory) return;
  // Stop only the exact cluster created by this invocation. Never stop by port.
  if (server) {
    const stop = spawnSync(path.join(bin, 'pg_ctl.exe'), ['-D', target.directory, '-m', 'immediate', '-w', '-t', '20', 'stop'], {env, windowsHide: true, timeout: 25000, stdio: 'ignore'});
    if (stop.status !== 0 && server.exitCode === null) {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(Error('local_stop_timeout')), 5000);
        server.once('close', () => {clearTimeout(timer); resolve();});
        if (!server.kill()) {clearTimeout(timer); reject(Error('local_stop_failed'));}
      });
    }
  }
  if (path.dirname(directory) !== path.resolve(base) || path.basename(directory) !== 'restore-drill-' + id) throw Error('cleanup_scope_invalid');
  await rm(directory, {recursive: true, force: false});
  cleanup = true;
}

try {
  if (process.platform !== 'win32') throw Error('windows_required');
  const sourceInput = restoreInput(operationsDirectory, process.argv.slice(2));
  const {recovery} = sourceInput;
  for (const name of ['postgres', 'initdb', 'pg_ctl', 'pg_restore', 'pg_dump', 'psql']) {
    if (!(await stat(path.join(bin, name + '.exe'))).isFile()) throw Error('drill_client_missing');
  }
  const manifest = sourceInput.imported
    ? JSON.parse(await readFile(path.join(sourceInput.directory, 'latest-backup.json'), 'utf8'))
    : await latestManifest();
  if (!manifest?.verified || typeof manifest.file !== 'string' || path.basename(manifest.file) !== manifest.file) throw Error('backup_missing');
  const archive = path.join(sourceInput.directory, 'backups', manifest.file);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(archive)) hash.update(chunk);
  if (hash.digest('hex') !== manifest.sha256) throw Error('backup_hash_invalid');
  key = recovery
    ? await openRecoveryKey(JSON.parse(await readFile(path.join(sourceInput.directory, 'recovery-key-v1.json'), 'utf8')), await promptRecoveryPassword())
    : await backupKey();
  await verifyBackup(archive, key);
  const archivedSql = await command('pg_restore', ['--data-only', '--file=-'], {input: decryptBackup(archive, key), allowEarlyClose: true});
  const source = copyFingerprints(archivedSql);
  await mkdir(base, {recursive: true});
  directory = path.join(path.resolve(base), 'restore-drill-' + id);
  await mkdir(directory);
  target = restoreTarget(path.join(directory, 'data'), await randomPort());
  // Explicit private Windows ACL before initializing any data files.
  const identity = spawnSync('powershell.exe', ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', '[Security.Principal.WindowsIdentity]::GetCurrent().User.Value'], {encoding: 'utf8', windowsHide: true});
  const sid = identity.stdout?.trim();
  if (identity.status !== 0 || !/^S-1-[0-9-]+$/.test(sid)) throw Error('local_acl_unavailable');
  const acl = spawnSync('icacls.exe', [directory, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F'], {windowsHide: true, stdio: 'ignore'});
  if (acl.status !== 0) throw Error('local_acl_unavailable');
  const password = randomBytes(32).toString('base64url');
  const passwordFile = path.join(directory, 'init-password');
  await writeFile(passwordFile, password, {flag: 'wx', mode: 0o600});
  env.PGPASSWORD = password;
  phase = 'initialize';
  await command('initdb', ['-D', target.directory, '-L', path.join(tools, 'share'), '--username=meta_restore', '--pwfile=' + passwordFile, '--auth=scram-sha-256', '--encoding=UTF8', '--locale=C', '--no-instructions']);
  await unlink(passwordFile);
  // No network extension, scheduler, replication, or application worker is installed.
  phase = 'start';
  server = spawn(path.join(bin, 'postgres.exe'), ['-D', target.directory, '-h', target.host, '-p', target.port, '-c', 'logging_collector=off', '-c', 'log_statement=none', '-c', 'log_min_error_statement=panic', '-c', 'shared_preload_libraries=', '-c', 'max_connections=10', '-c', 'shared_buffers=16MB'], {env, windowsHide: true, stdio: 'ignore'});
  server.on('error', () => {});
  const deadline = Date.now() + 30000;
  let ready = false;
  while (Date.now() < deadline && server.exitCode === null) {
    try {if ((await query('select current_setting(\'data_directory\');')).trim().replaceAll('\\', '/').toLowerCase() === target.directory.replaceAll('\\', '/').toLowerCase()) {ready = true; break;}} catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!ready) throw Error('local_server_not_ready');
  phase = 'bootstrap';
  await query(`
    drop schema public;
    create schema extensions;
    create extension pgcrypto with schema extensions;
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create role postgres nologin;
    create role supabase_admin nologin;
    create role supabase_auth_admin nologin;
    create role dashboard_user nologin;
  `);
  phase = 'restore';
  await command('pg_restore', [...localArgs(), '--no-owner', ...(manifest.accessPrivilegesIncluded ? [] : ['--no-privileges']), '--exit-on-error', '--single-transaction'], {input: decryptBackup(archive, key), timeout: 180000});
  phase = 'comparison';
  const restoredSql = await command('pg_dump', [...localArgs(), '--data-only', '--no-owner', '--no-privileges', '--schema=public', '--schema=private', '--schema=auth', '--schema=supabase_migrations'], {timeout: 180000});
  const restored = copyFingerprints(restoredSql);
  if (!matchingCopies(source, restored)) throw Error('restored_data_mismatch');
  const counts = JSON.parse((await query(`select json_build_object(
    'publishedQuestions',(select count(*) from public.questions where status='published'),
    'questionAnswers',(select count(*) from public.question_answers),
    'introQuestions',(select count(*) from private.intro_quiz_catalog),
    'simulationModels',(select count(*) from private.simulations),
    'rlsTables',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r' and c.relrowsecurity)
  );`)).trim());
  let accessPrivilegesTested = false;
  if (manifest.accessPrivilegesIncluded === true) {
    phase = 'permissions';
    const permissions = (await query(`select
      not has_table_privilege('anon','public.questions','select')
      and not has_table_privilege('authenticated','public.question_answers','select')
      and has_table_privilege('service_role','public.question_answers','select')
      and not has_table_privilege('anon','private.intro_quiz_catalog','select')
      and not has_function_privilege('anon','public.start_guest_quiz(text)','execute')
      and not has_function_privilege('authenticated','public.start_guest_quiz(text)','execute')
      and has_function_privilege('service_role','public.start_guest_quiz(text)','execute');`)).trim();
    if (permissions !== 't') throw Error('restored_permissions_mismatch');
    accessPrivilegesTested = true;
  }
  let firstPurchasePromotionTested = false;
  if ((await query("select exists(select 1 from supabase_migrations.schema_migrations where version='20261017210000');")).trim() === 't') {
    phase = 'first_purchase_promotion';
    // The existing business scenarios execute ONLY against this invocation's local cluster.
    // No production credentials, provider calls or committed fixtures are involved.
    const sql = await readFile(new URL('../supabase/tests/test_first_purchase_promotion.sql', import.meta.url), 'utf8');
    const checked = await query('BEGIN;\n' + sql + '\nROLLBACK;');
    if (!checked.trim().endsWith('t')) throw Error('restored_promotion_mismatch');
    firstPurchasePromotionTested = true;
  }
  result = {passed: true, checkedAt: new Date().toISOString(), backupCreatedAt: manifest.createdAt, archiveSha256: manifest.sha256, tablesCompared: Object.keys(source).length, dataIdentical: true, ...counts, accessPrivilegesTested, firstPurchasePromotionTested, keySource: recovery ? 'password-protected-recovery' : 'windows-profile', inputSource: sourceInput.imported ? 'imported-recovery-set' : 'local-backup', target: 'temporary-local-postgresql', productionContacted: false, managedSupabaseServicesTested: false, offsite: false};
} catch (error) {
  const reasons = ['backup_missing', 'backup_hash_invalid', 'drill_client_missing', 'local_acl_unavailable', 'local_server_not_ready', 'restored_data_mismatch', 'restored_permissions_mismatch', 'restored_promotion_mismatch', 'local_command_failed', 'local_input_failed', 'incomplete_copy_data', 'unsupported_copy_table'];
  result = {passed: false, checkedAt: new Date().toISOString(), phase, reason: reasons.includes(error.message) ? error.message : 'restore_drill_incomplete', ...(localIssue ? {localIssue} : {}), productionContacted: false};
  process.exitCode = 1;
} finally {
  try {await clean();} catch {cleanup = false; process.exitCode = 1;}
  key?.fill(0);
  result = {...result, temporaryDatabaseRemoved: cleanup};
  if (!cleanup && directory) result.passed = false;
  if (result.passed) {
    const file = path.join(operationsDirectory, 'latest-restore-drill.json');
    const temporary = file + '.' + id;
    await writeFile(temporary, JSON.stringify(result, null, 2), {mode: 0o600});
    await rename(temporary, file);
  }
  console.log(JSON.stringify(result));
}
