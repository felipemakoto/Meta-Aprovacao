import { pathToFileURL } from 'node:url';

// Consulta administrativa local. Não importa código do cliente nem grava IDs.
export async function listOffers(env, request = fetch) {
  const { CAKTO_CLIENT_ID: clientId, CAKTO_CLIENT_SECRET: secret, CAKTO_PRODUCT_ID: product } = env;
  if (!clientId || !secret || !product) {
    throw new Error('Configure CAKTO_CLIENT_ID, CAKTO_CLIENT_SECRET e CAKTO_PRODUCT_ID em .env.local.');
  }
  async function json(url, options) {
    let response;
    try {
      response = await request(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) });
    } catch {
      throw new Error('Falha de conexão com a Cakto. Nenhuma configuração foi alterada.');
    }
    if (!response.ok) throw new Error(`Cakto respondeu HTTP ${response.status}. Confira credenciais e permissões.`);
    try { return await response.json(); }
    catch { throw new Error('Resposta inválida da Cakto.'); }
  }
  const token = await json('https://api.cakto.com.br/public_api/token/', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: secret }),
  });
  if (typeof token.access_token !== 'string' || !token.access_token || token.token_type !== 'Bearer') {
    throw new Error('Resposta de autenticação inválida da Cakto.');
  }
  const offers = [];
  for (let page = 1; page <= 20; page++) {
    const url = new URL('https://api.cakto.com.br/public_api/offers/');
    url.search = new URLSearchParams({ product, limit: '100', page: String(page) }).toString();
    const data = await json(url.href, { method: 'GET', headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!Array.isArray(data.results)) throw new Error('Formato de ofertas inválido da Cakto.');
    for (const offer of data.results) {
      if (offer?.product !== product) throw new Error('A Cakto retornou oferta de outro produto; consulta interrompida.');
      if (typeof offer.id !== 'string' || typeof offer.name !== 'string' || !Number.isFinite(offer.price)) {
        throw new Error('Dados comerciais incompletos na resposta da Cakto.');
      }
      // Somente campos comerciais: nunca imprimir token ou resposta completa.
      offers.push({ id: offer.id, nome: offer.name, precoReais: offer.price,
        status: offer.status, tipo: offer.type, intervalo: offer.intervalType,
        quantidadeIntervalos: offer.interval, periodoRecorrencia: offer.recurrence_period,
        renovacoes: offer.quantity_recurrences });
    }
    if (!data.next) return offers;
    // Não seguir URLs de paginação recebidas com o Bearer; reconstruir endpoint fixo.
  }
  throw new Error('Limite de paginação atingido; consulta incompleta.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const offers = await listOffers(process.env);
    console.log(JSON.stringify(offers, null, 2));
    console.log('Consulta somente de leitura. Confira a oferta antes de configurar seu ID.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
