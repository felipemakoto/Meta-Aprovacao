// Opt-in: sends ONE signup email to an explicit Gmail alias; no recovery mail or payment.
// Paste the received verification URL into stdin. Password, verifier and tokens stay in memory.
import assert from 'node:assert/strict';
import {randomBytes, randomUUID} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync, rmSync} from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import {createInterface} from 'node:readline';
import path from 'node:path';
import {testMailbox, confirmationLink, confirmationCallback} from './lib/signup-delivery.mjs';
import {legalDocuments} from '../src/lib/auth/legal-documents.ts';
import {checkoutEnabled} from '../src/lib/subscriptions/checkout-launch.ts';

const site = 'https://meta-aprovacao.vercel.app';
const tag = randomUUID(), password = randomBytes(32).toString('base64url');
const started = new Date().toISOString(), checks = [], jar = new Map();
let phase = 'configuration', attempted = false, cleaned = false, email, cli, provider, file;
// A PTY keeps interactive stdin open. Raw mode prevents a pasted token being echoed by it.
const rawInput = !!process.stdin.isTTY;
if (rawInput) process.stdin.setRawMode(true);
const input = createInterface({input: process.stdin, terminal: false});
// Install before sending so an early receipt is not dropped. Queue at most one bounded URL.
let deliver, buffered;
let inputClosed = false;
input.on('close', () => { inputClosed = true; });
input.on('line', line => {
  if (line.length > 4096 || buffered !== undefined) return;
  if (deliver) { const resolve = deliver; deliver = undefined; resolve(line.trim()); }
  else buffered = line.trim();
});
function receivedLink() {
  return new Promise((resolve, reject) => {
    if (buffered !== undefined) { const value = buffered; buffered = undefined; resolve(value); return; }
    if (inputClosed) { reject(Error('mail_input_closed')); return; }
    const timer = setTimeout(() => { deliver = undefined; reject(Error('mail_receipt_timeout')); }, 300000);
    deliver = value => { clearTimeout(timer); resolve(value); };
    input.once('close', () => { clearTimeout(timer); deliver = undefined; reject(Error('mail_input_closed')); });
  });
}
function query(sql, marker) {
  writeFileSync(file, sql);
  const result = spawnSync(process.execPath, [cli, 'db', 'query', '--linked', '--file', file], {
    encoding: 'utf8', windowsHide: true, timeout: 45000,
  });
  if (result.error || result.status !== 0 || /"_tag"\s*:\s*"Error"/.test(result.stdout) ||
      !result.stdout.includes(marker)) throw Error('fixture_sql_failed');
}
async function request(route, {body, expected = 200} = {}) {
  const headers = {Cookie: [...jar].map(([key, value]) => key + '=' + value).join('; ')};
  if (body) { headers.Origin = site; headers['Content-Type'] = 'application/json'; }
  const response = await fetch(site + route, {
    method: body ? 'POST' : 'GET', headers, redirect: 'manual', signal: AbortSignal.timeout(20000),
    ...(body ? {body: JSON.stringify(body)} : {}),
  });
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0], i = pair.indexOf('=');
    if (/max-age=0(?:;|$)/i.test(cookie)) jar.delete(pair.slice(0, i));
    else jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  assert.equal(response.status, expected);
  return response;
}
async function json(route, options) {
  const response = await request(route, options);
  assert.match(response.headers.get('cache-control'), /no-store/);
  return response.json();
}
function fixtureScope() {
  // All values are generated UUIDs/dates or strictly validated mailbox/version literals.
  return `email='${email}' and created_at>='${started}'::timestamptz
    and raw_user_meta_data->'legal_acceptance'->>'version'='${legalDocuments.version}'
    and raw_user_meta_data->'legal_acceptance'->>'terms_accepted'='true'
    and raw_user_meta_data->'legal_acceptance'->>'privacy_acknowledged'='true'`;
}
try {
  assert.deepEqual(process.argv.slice(2), ['--mailbox', process.argv[3], '--send-test-email']);
  assert.equal(rawInput, true); // Refuse noninteractive runs before creating an account or sending mail.
  email = testMailbox(process.argv[3], tag);
  assert.match(legalDocuments.version, /^[0-9.-]+$/);
  assert.equal(checkoutEnabled, false);
  provider = process.env.NEXT_PUBLIC_SUPABASE_URL;
  assert.match(provider ?? '', /^https:\/\/[a-z0-9]{20}\.supabase\.co$/);
  assert.equal(new URL(provider).hostname, readFileSync('supabase/.temp/project-ref', 'utf8').trim() + '.supabase.co');
  const require = createRequire(import.meta.url), pkg = require.resolve('supabase/package.json');
  cli = path.resolve(path.dirname(pkg), require(pkg).bin.supabase);
  mkdirSync('supabase/.temp', {recursive: true});
  file = path.resolve(`supabase/.temp/signup-delivery-${tag}.sql`);
  phase = 'preflight';
  query(`do $$begin if exists(select 1 from auth.users where email='${email}') then raise exception 'fixture_exists';end if;end$$;
    select true as signup_delivery_preflight;`, 'signup_delivery_preflight');
  phase = 'public_signup'; attempted = true;
  assert.deepEqual(await json('/api/auth/signup', {expected: 202, body: {
    email, password, confirmPassword: password, acceptedLegal: true, legalVersion: legalDocuments.version,
  }}), {status: 'check_email'});
  query(`begin;set local statement_timeout='15s';
    do $$begin if (select count(*) from auth.users where ${fixtureScope()} and email_confirmed_at is null)<>1
      then raise exception 'signup_fixture_missing';end if;end$$;
    update auth.users set raw_app_meta_data=raw_app_meta_data||jsonb_build_object('delivery_fixture','${tag}') where ${fixtureScope()};
    select true as signup_delivery_created;commit;`, 'signup_delivery_created');
  assert.ok([...jar.keys()].some(key => key.includes('code-verifier')));
  assert.deepEqual(await json('/api/auth/login', {expected: 401, body: {email, password}}), {error: 'invalid_credentials'});
  checks.push('public_signup_unconfirmed_and_pkce_created');
  phase = 'awaiting_received_email';
  console.log(JSON.stringify({phase, recipient: email, input: 'verification_url_from_received_email', inputEcho: false, timeoutSeconds: 300}));
  const action = confirmationLink(await receivedLink(), provider, site);
  phase = 'verify_email';
  const verified = await fetch(action, {redirect: 'manual', signal: AbortSignal.timeout(15000)});
  assert.ok([302, 303].includes(verified.status));
  const callback = confirmationCallback(verified.headers.get('location'), site);
  const confirmed = await request(callback, {expected: 303});
  assert.equal(new URL(confirmed.headers.get('location'), site).href, site + '/cadastro/confirmado');
  assert.deepEqual(await json('/api/auth/status'), {authenticated: true});
  assert.match(await (await request('/cadastro/confirmado')).text(), /E-mail confirmado/);
  query(`do $$begin if (select count(*) from auth.users where ${fixtureScope()} and email_confirmed_at is not null
    and raw_app_meta_data->>'delivery_fixture'='${tag}')<>1 then raise exception 'signup_not_confirmed';end if;end$$;
    select true as signup_delivery_confirmed;`, 'signup_delivery_confirmed');
  checks.push('received_email_confirmation_and_authenticated_plan_page');
  phase = 'returning_login';
  assert.deepEqual(await json('/api/auth/logout', {body: {}}), {status: 'signed_out'});
  assert.deepEqual(await json('/api/auth/login', {body: {email, password}}), {status: 'signed_in'});
  await request('/dashboard');
  const question = (await json('/api/practice', {body: {action: 'next', filters: {
    subject: 'matematica', topic: '', difficulty: 'all', exam: 'all',
  }, previous: null, requestId: randomUUID()}})).question;
  assert.ok(question?.id);
  await json('/api/practice', {body: {action: 'answer', id: question.id, answer: 'A'}});
  assert.deepEqual(await json('/api/auth/logout', {body: {}}), {status: 'signed_out'});
  assert.deepEqual(await json('/api/auth/login', {body: {email, password}}), {status: 'signed_in'});
  const history = await json('/api/history?kind=practice');
  assert.ok(history.items.some(item => item.id === question.id));
  assert.deepEqual(await json('/api/auth/logout', {body: {}}), {status: 'signed_out'});
  checks.push('confirmed_account_can_return_to_persisted_studies');
  phase = 'replay_guard';
  const replay = await request(callback, {expected: 303});
  assert.equal(new URL(replay.headers.get('location'), site).href, site + '/cadastro/confirmacao-invalida');
  assert.deepEqual(await json('/api/auth/status', {expected: 401}), {authenticated: false});
  checks.push('consumed_pkce_code_cannot_sign_in_again');
} catch {
  console.error(JSON.stringify({passed: false, phase, checks})); process.exitCode = 1;
} finally {
  input.close();
  if (rawInput) process.stdin.setRawMode(false);
  if (attempted) {
    try {
      // Also recover an uncertain signup response: exact random alias, time and legal fields.
      query(`begin;set local statement_timeout='15s';
        update auth.users set raw_app_meta_data=raw_app_meta_data||jsonb_build_object('delivery_fixture','${tag}')
          where ${fixtureScope()} and not(raw_app_meta_data ? 'delivery_fixture');
        create temporary table delivery_fixture as select id from auth.users where ${fixtureScope()}
          and raw_app_meta_data->>'delivery_fixture'='${tag}';
        do $$begin if (select count(*) from delivery_fixture)>1 then raise exception 'cleanup_ambiguous';end if;end$$;
        delete from auth.users where id in(select id from delivery_fixture);
        do $$begin if exists(select 1 from auth.users where email='${email}') or
          exists(select 1 from auth.identities where user_id in(select id from delivery_fixture)) or
          exists(select 1 from private.practice_attempts where user_id in(select id from delivery_fixture)) or
          exists(select 1 from private.practice_requests where user_id in(select id from delivery_fixture)) or
          exists(select 1 from private.checkout_intents where user_id in(select id from delivery_fixture))
          then raise exception 'cleanup_failed';end if;end$$;
        select true as signup_delivery_removed;commit;`, 'signup_delivery_removed');
      cleaned = true;
    } catch { console.error(JSON.stringify({passed: false, phase: 'fixture_cleanup'})); process.exitCode = 1; }
  }
  if (file) rmSync(file, {force: true});
  console.log(JSON.stringify({sampledAt: new Date().toISOString(), passed: !process.exitCode,
    checks, fixtureRemoved: cleaned, emailRequested: attempted, paymentRequested: false}));
}
