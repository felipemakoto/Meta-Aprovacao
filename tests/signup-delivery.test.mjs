import test from 'node:test';
import assert from 'node:assert/strict';
import {testMailbox, confirmationLink, confirmationCallback} from '../scripts/lib/signup-delivery.mjs';

const tag = 'c27ccfdc-a20e-471c-bf51-a22688d40125';
const provider = 'https://abcdefghijklmnopqrst.supabase.co', site = 'https://site.example';
const link = `${provider}/auth/v1/verify?type=signup&token=${'a'.repeat(64)}&redirect_to=${encodeURIComponent(site + '/auth/confirm')}`;

test('conta descartável exige caixa explícita e identificador aleatório, sem aceitar SQL ou conta anterior', () => {
  assert.equal(testMailbox('owner@gmail.com', tag), 'owner+tc27ccfdca20e471cbf51a22688d40125@gmail.com');
  for (const mailbox of ['owner+old@gmail.com', "owner'@gmail.com", 'owner@gmail.com.evil', 'owner@example.com', undefined]) {
    assert.throws(() => testMailbox(mailbox, tag), /^Error: invalid_test_mailbox$/);
  }
  assert.throws(() => testMailbox('owner@gmail.com', 'existing-account'));
  assert.throws(() => testMailbox('a'.repeat(31) + '@gmail.com', tag));
});

test('somente confirmação signup do projeto e retorno fixo podem consumir token', () => {
  assert.equal(confirmationLink(link, provider, site).href, link);
  for (const candidate of [link.replace(provider, 'https://evil.example'), link.replace('signup', 'recovery'),
    link + '&type=signup', link + '&next=https://evil.example', link + '#private',
    link.replace(encodeURIComponent(site + '/auth/confirm'), encodeURIComponent('https://evil.example')),
    link.replace('/auth/v1/verify', '/other'), link.replace('https://', 'http://')]) {
    assert.throws(() => confirmationLink(candidate, provider, site), /^Error: invalid_confirmation_link$/);
  }
});

test('troca PKCE não segue destinos externos, fragmentos, erros ou códigos ambíguos', () => {
  const callback = `${site}/auth/confirm?code=${'b'.repeat(36)}`;
  assert.equal(confirmationCallback(callback, site), '/auth/confirm?code=' + 'b'.repeat(36));
  for (const candidate of [callback.replace(site, 'https://evil.example'), callback + '&code=another',
    callback + '&error=denied', callback + '#access_token=private', callback.replace('/auth/confirm', '/login'),
    `${site}/auth/confirm?code=short`]) {
    assert.throws(() => confirmationCallback(candidate, site), /^Error: invalid_confirmation_callback$/);
  }
});
