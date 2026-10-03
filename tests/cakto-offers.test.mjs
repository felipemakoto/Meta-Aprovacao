import test from 'node:test';
import assert from 'node:assert/strict';
import { listOffers } from '../scripts/cakto-offers.mjs';

const env = { CAKTO_CLIENT_ID: 'fake-client', CAKTO_CLIENT_SECRET: 'fake-secret', CAKTO_PRODUCT_ID: 'product-test' };
const result = (body) => ({ ok: true, json: async () => body });
test('consulta filtra produto, mantém endpoints fixos e descarta campos privados', async () => {
  const calls = [];
  const responses = [result({ access_token: 'fake-token', token_type: 'Bearer' }),
    result({ next: 'https://outro-host.invalid/', results: [{ id: 'offer-test', name: 'Mensal', price: 20, product: env.CAKTO_PRODUCT_ID, privateField: 'omit' }] }),
    result({ next: null, results: [] })];
  const offers = await listOffers(env, async (url, options) => { calls.push({ url, options }); return responses.shift(); });
  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(new URL(call.url).origin, 'https://api.cakto.com.br');
    assert.equal(call.options.redirect, 'error');
  }
  assert.equal(new URL(calls[2].url).searchParams.get('page'), '2');
  assert.equal(new URL(calls[1].url).searchParams.get('product'), env.CAKTO_PRODUCT_ID);
  assert.equal(offers[0].id, 'offer-test');
  assert.equal(offers[0].precoReais, 20);
  assert.equal(JSON.stringify(offers).includes('omit'), false);
});
test('sem credenciais não faz chamadas; erros de rede não expõem segredo', async () => {
  await assert.rejects(listOffers({}, () => assert.fail('Não deve chamar API')), /Configure/);
  await assert.rejects(listOffers(env, () => { throw new Error('fake-secret'); }), (error) => !error.message.includes('fake-secret'));
});
test('rejeita oferta de outro produto e omite corpo de erro do provedor', async () => {
  let count = 0;
  await assert.rejects(listOffers(env, async () => ++count === 1
    ? result({ access_token: 'fake-token', token_type: 'Bearer' })
    : result({ results: [{ product: 'other' }] })), /outro produto/);
  await assert.rejects(listOffers(env, async () => ({ ok: false, status: 401, json: () => assert.fail('Não ler corpo') })), /HTTP 401/);
});
