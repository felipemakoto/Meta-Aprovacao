import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {copyFingerprints, matchingCopies, restoreTarget, restoreInput} from '../src/lib/operations/restore-check.ts';
import path from 'node:path';
import {sealRecoveryKey, openRecoveryKey} from '../src/lib/operations/recovery-key.ts';
import {promptRecoveryPassword} from '../scripts/recovery-password.mjs';

const copy = rows => 'COPY public.questions (id, statement) FROM stdin;\n' + rows.join('\n') + '\n\\.\n';
test('conjunto importado exige UUID e senha, sem permitir URL, caminho ou destino externo', () => {
  const root = path.resolve('operations-test'), tag = '10000000-0000-4000-8000-000000000001';
  assert.deepEqual(restoreInput(root, []), {directory: root, recovery: false, imported: false});
  assert.deepEqual(restoreInput(root, ['--recovery']), {directory: root, recovery: true, imported: false});
  assert.deepEqual(restoreInput(root, ['--recovery-set', tag]), {
    directory: path.join(root, 'recovery-input', tag), recovery: true, imported: true,
  });
  for (const args of [['--recovery-set', '../production'], ['--recovery-set', 'C:\\data'],
    ['--recovery-set', 'https://database.example'], ['--recovery-set', tag, '--host=production'],
    ['--recovery', '--recovery-set', tag], ['--target', tag], ['--recovery-set']]) {
    assert.throws(() => restoreInput(root, args), /no_target_arguments_allowed/);
  }
});
test('comparação considera todas as linhas, preserva duplicatas e ignora a ordem física', () => {
  const a = copyFingerprints(copy(['1\tA', '2\tB', '2\tB']));
  assert.equal(matchingCopies(a, copyFingerprints(copy(['2\tB', '1\tA', '2\tB']))), true);
  assert.equal(matchingCopies(a, copyFingerprints(copy(['1\tA', '2\tB']))), false);
  assert.equal(matchingCopies(a, copyFingerprints(copy(['1\tA', '2\tC', '2\tB']))), false);
  assert.doesNotMatch(JSON.stringify(a), /statement|1\\tA/);
});
test('dados incompletos, tabelas desconhecidas ou ausentes não passam', () => {
  assert.throws(() => copyFingerprints('COPY public.questions (id) FROM stdin;\n1\n'));
  assert.throws(() => copyFingerprints('COPY storage.objects (id) FROM stdin;\n\\.\n'));
  assert.throws(() => copyFingerprints(copy(['1']) + copy(['2'])));
  const a = copyFingerprints(copy(['1']));
  assert.equal(matchingCopies(a, {...a, 'auth.users': a['public.questions']}), false);
});
test('destino de restauração fica em loopback com nome temporário e porta restrita', () => {
  const directory = 'C:\\local\\drills\\restore-drill-10000000-0000-4000-8000-000000000001\\data';
  assert.equal(restoreTarget(directory, 51234).host, '127.0.0.1');
  assert.throws(() => restoreTarget('C:\\production\\data', 51234));
  assert.throws(() => restoreTarget(directory, 5432));
  assert.throws(() => restoreTarget(directory, 65536));
});
test('chave de recuperação funciona sem DPAPI e rejeita senha errada, adulteração ou custo arbitrário', async () => {
  const key = randomBytes(32), password = 'senha-de-teste-exclusiva-58';
  const envelope = await sealRecoveryKey(key, password);
  assert.deepEqual(await openRecoveryKey(envelope, password), key);
  assert.equal(JSON.stringify(envelope).includes(key.toString('base64')), false);
  await assert.rejects(openRecoveryKey(envelope, 'outra-senha-de-teste-58'));
  await assert.rejects(openRecoveryKey({...envelope, tag: randomBytes(16).toString('base64')}, password));
  await assert.rejects(openRecoveryKey({...envelope, N: 2 ** 30}, password));
  await assert.rejects(sealRecoveryKey(key, 'curta'));
});
test('formulário local recusa outra origem, token incorreto e senha curta, sem retornar a senha', async () => {
  let ready;
  const urlReady = new Promise(resolve => {ready = resolve;});
  const passwordResult = promptRecoveryPassword(true, {onReady: ready, timeout: 10000});
  const url = await urlReady, origin = new URL(url).origin;
  const page = await fetch(url), html = await page.text();
  assert.equal(page.status, 200);
  assert.equal(page.headers.get('cache-control'), 'no-store');
  assert.match(page.headers.get('content-security-policy'), /connect-src 'self'/);
  assert.match(html, /type="password"/);
  const token = new URL(url).pathname.split('/').at(-1);
  const post = (site, value, secret) => fetch(url, {method: 'POST', headers: {'Content-Type': 'application/json', 'Origin': site, 'X-Recovery-Token': secret}, body: JSON.stringify({password: value})});
  assert.equal((await post('https://example.com', 'senha-local-para-teste-58', token)).status, 403);
  assert.equal((await post(origin, 'senha-local-para-teste-58', '0'.repeat(64))).status, 403);
  assert.equal((await post(origin, 'curta', token)).status, 400);
  const accepted = await post(origin, 'senha-local-para-teste-58', token);
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), {received: true});
  assert.equal(await passwordResult, 'senha-local-para-teste-58');
});
