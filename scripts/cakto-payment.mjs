// Administrative read only: never grants Premium or writes payment records.
import { caktoReader, CaktoReadError } from '../src/lib/subscriptions/cakto-api.ts';
try {
 const id=process.argv[2] ?? '';
 const {order,subscription}=await caktoReader(process.env).orderAndSubscription(id);
 console.log(JSON.stringify({consulta:'concluida',pedidoPago:order.status==='paid',produtoPermitido:order.product?.id===process.env.CAKTO_PRODUCT_ID,
  assinaturaConsultada:!!subscription,ofertaPermitida:!!subscription && [process.env.CAKTO_REGULAR_OFFER_ID,process.env.CAKTO_OCTOBER_OFFER_ID].includes(subscription.offer),
  moedaBrlExplicita:order.currency==='BRL',referenciaPresente:typeof order.sck==='string' && /^[a-f0-9]{64}$/.test(order.sck)},null,2));
 console.log('Consulta não concede acesso nem comprova vínculo com uma conta. Nunca imprima a resposta completa.');
} catch(error) {
 console.error('Consulta não concluída: '+(error instanceof CaktoReadError ? error.message : 'unavailable'));
 process.exitCode=1;
}
