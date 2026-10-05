// Aplicação Next em produção, acessível somente em loopback, com segredo efêmero de teste.
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY?.startsWith('sb_secret_')) {
  throw Error('Configure o ambiente local do servidor antes deste teste.');
}
const require = createRequire(import.meta.url);
const pkg = require.resolve('supabase/package.json');
const cli = path.resolve(path.dirname(pkg), JSON.parse(readFileSync(pkg, 'utf8')).bin.supabase);
const next = require.resolve('next/dist/bin/next');
const dir = path.resolve('supabase/.temp'); mkdirSync(dir, { recursive: true });
const order = randomUUID(), other = randomUUID(), secret = randomBytes(32).toString('hex');
const file = path.join(dir, `webhook-integration-${order}.sql`);
const origin = 'http://127.0.0.1:3101';
const product = 'fixture-product', offer = 'fixture-offer';
const server = spawn(process.execPath, [next, 'start', '--hostname', '127.0.0.1', '--port', '3101'], {
  env: { ...process.env, CAKTO_WEBHOOK_SECRET: secret, CAKTO_PRODUCT_ID: product,
    CAKTO_REGULAR_OFFER_ID: offer, CAKTO_OCTOBER_OFFER_ID: offer }, windowsHide: true, stdio: 'ignore',
});
let closed = false;
server.on('exit', () => { closed = true; });
server.on('error', () => { closed = true; });
function query(sql) {
  writeFileSync(file, sql);
  const r = spawnSync(process.execPath, [cli, 'db', 'query', '--linked', '--file', file], { encoding: 'utf8', timeout: 45000, windowsHide: true });
  if (r.status !== 0 || r.error || r.stdout.includes('"_tag":"Error"')) throw Error('Falha na verificação/limpeza SQL da fixture.');
}
async function send(payload, { stale = false, tamper = false } = {}) {
  const timestamp = String(Math.floor(Date.now() / 1000) - (stale ? 301 : 0));
  const body = JSON.stringify(payload);
  const signature = 'v1=' + createHmac('sha256', secret).update(timestamp + '.').update(body).digest('hex');
  return fetch(origin + '/api/webhooks/cakto', { method: 'POST', signal: AbortSignal.timeout(10000),
    headers: { 'content-type': 'application/json', 'x-cakto-timestamp': timestamp, 'x-cakto-signature': signature },
    body: tamper ? body + ' ' : body });
}
const data = { id: order, product: { id: product }, offer: { id: offer }, status: 'paid', paidAt: '2026-10-05T12:00:00-03:00',
  customer: { email: 'fixture@example.invalid', docNumber: 'fixture-private' }, card: { lastDigits: 'fixture-private' } };
const payload = { secret, event: 'purchase_approved', data };
try {
  let ready = false;
  for (let i = 0; i < 80 && !closed; i++) {
    try { ready = (await fetch(origin + '/api/webhooks/cakto', { signal: AbortSignal.timeout(500) })).status === 405; } catch { /* inicialização */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Servidor isolado não iniciou; execute npm.cmd run build e libere a porta 3101.');
  assert.equal((await send(payload, { tamper: true })).status, 401);
  assert.equal((await send(payload, { stale: true })).status, 401);
  // Duas requisições reais simultâneas, cada uma atravessa rota Next e DAL/RPC.
  const repeated = await Promise.all([send(payload), send(payload)]);
  repeated.forEach(r => assert.equal(r.status, 200, 'Entrega válida não foi persistida.'));
  query(`do $$begin if (select count(*) from private.cakto_event_inbox where order_id='${order}')<>1 then raise exception 'concurrency dedup failed';end if;end$$;`);
  assert.equal((await send({ ...payload, event: 'refund', data: { ...data, status: 'refunded', refundedAt: '2026-10-05T16:00:00Z' } })).status, 200);
  // Lote inválido não pode salvar parcialmente.
  assert.equal((await send({ ...payload, data: [{ ...data, id: other }, { ...data, product: { id: 'foreign' } }] })).status, 400);
  query(`do $$begin
   if (select count(*) from private.cakto_event_inbox where order_id='${order}')<>2 then raise exception 'lifecycle event lost';end if;
   if exists(select 1 from private.cakto_event_inbox where order_id='${other}') then raise exception 'partial invalid batch';end if;
   if exists(select 1 from private.cakto_event_inbox where order_id='${order}' and (state<>'pending' or details ?| array['secret','customer','card'] or details::text like '%fixture-private%')) then raise exception 'private data or state changed';end if;
  end$$;`);
  console.log('HTTP positivo em produção aprovado: assinatura, persistência real, concorrência, mudança de evento e descarte de dados privados.');
} finally {
  server.kill();
  query(`begin; delete from private.cakto_event_inbox where order_id in('${order}','${other}');
   do $$begin if exists(select 1 from private.cakto_event_inbox where order_id in('${order}','${other}')) then raise exception 'fixture cleanup failed';end if;end$$;commit;`);
  rmSync(file, { force: true });
  console.log('Fixtures removidas. Segredo efêmero não salvo; ambiente e checkout real preservados.');
}
