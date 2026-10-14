// Server transport shared with local administrative scripts. No client imports.
import {Buffer} from "node:buffer";
export type CaktoOperation="authentication"|"orders_list"|"order"|"subscription";
type CaktoReason="configuration_missing"|"invalid_id"|"unavailable"|"unauthorized"|"not_found"|"rate_limited"|"invalid_response";
export class CaktoReadError extends Error {
  readonly reason:CaktoReason;
  readonly operation?:CaktoOperation;
  readonly status?:number;
  readonly timedOut:boolean;
  constructor(reason:CaktoReason,operation?:CaktoOperation,status?:number,timedOut=false) {
    super(reason);this.reason=reason;this.operation=operation;this.status=status;this.timedOut=timedOut;
  }
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function orderUuid(value: string) {
  if (!uuid.test(value)) throw new CaktoReadError("invalid_id");
  return value;
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CaktoReadError("invalid_response");
  return value as Record<string, unknown>;
}
export function caktoReader(env: Record<string, string | undefined>, transport: typeof fetch = fetch) {
  async function json(path: string, options: RequestInit, limit: number,operation:CaktoOperation) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let status:number|undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await transport(`https://api.cakto.com.br/public_api/${path}`, { ...options, redirect: "error", cache: "no-store", signal: controller.signal });
          status=response.status;
          if (!response.ok) {
            void response.body?.cancel().catch(() => {});
            throw new CaktoReadError([401,403].includes(response.status) ? "unauthorized" : response.status === 404 ? "not_found" : response.status === 429 ? "rate_limited" : "unavailable",operation,status);
          }
          if (response.headers.get("content-type")?.split(";")[0].trim() !== "application/json" || !response.body) throw new CaktoReadError("invalid_response");
          const length = response.headers.get("content-length");
          if (length && (!/^\d+$/.test(length) || Number(length) > limit)) throw new CaktoReadError("invalid_response");
          reader = response.body.getReader();
          const chunks: Uint8Array[] = []; let size = 0;
          while (true) {
            const {done, value} = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > limit) throw new CaktoReadError("invalid_response");
            chunks.push(value);
          }
          try { return record(JSON.parse(new TextDecoder("utf-8", {fatal:true}).decode(Buffer.concat(chunks)))); }
          catch { throw new CaktoReadError("invalid_response"); }
        })(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => {reject(new CaktoReadError("unavailable",operation,status,true));controller.abort();}, 8000); }),
      ]);
    } catch (error) { throw error instanceof CaktoReadError ? new CaktoReadError(error.reason,operation,status,error.timedOut) : new CaktoReadError("unavailable",operation,status); }
    finally { clearTimeout(timer); controller.abort(); void reader?.cancel().catch(() => {}); }
  }
  async function token() {
    const clientId = env.CAKTO_CLIENT_ID, secret = env.CAKTO_CLIENT_SECRET;
    if (!clientId || !secret) throw new CaktoReadError("configuration_missing","authentication");
    const result = await json("token/", {method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({client_id:clientId, client_secret:secret})}, 16384,"authentication");
    if (typeof result.access_token !== "string" || !result.access_token || result.token_type !== "Bearer") throw new CaktoReadError("invalid_response","authentication",200);
    return result.access_token;
  }
  return {
    async recentOrderIds(product:string,since:string,until:string,page=1) {
      if (!/^[A-Za-z0-9_-]{1,200}$/.test(product) || !Number.isInteger(page) || page<1 || page>100 ||
        !Number.isFinite(Date.parse(since)) || !Number.isFinite(Date.parse(until)) || Date.parse(until)<=Date.parse(since)) throw new CaktoReadError("invalid_id");
      const accessToken=await token();
      const params=new URLSearchParams({product,createdAt__gte:since,createdAt__lt:until,status:"paid",type:"subscription",offer_type:"main",ordering:"-createdAt",limit:"5",page:String(page)});
      const result=await json(`orders/?${params}`,{method:"GET",headers:{Authorization:`Bearer ${accessToken}`}},1024*1024,"orders_list");
      if (!Array.isArray(result.results) || result.results.length>5) throw new CaktoReadError("invalid_response","orders_list",200);
      const orderIds=result.results.map(value=>{
        try {
          const r=record(value);
          if(record(r.product).id!==product || typeof r.id!=="string") throw Error();
          return orderUuid(r.id);
        } catch {throw new CaktoReadError("invalid_response","orders_list",200);}
      });
      // Never follow provider pagination URLs with a bearer token.
      return {orderIds:[...new Set(orderIds)],hasMore:!!result.next};
    },
    async orderAndSubscription(id: string) {
      orderUuid(id); // Validate before credentials or network access.
      const accessToken = await token();
      const options = {method:"GET", headers:{Authorization:`Bearer ${accessToken}`}};
      const order = await json(`orders/${id}/`, options, 1024 * 1024,"order");
      if (order.id !== id) throw new CaktoReadError("invalid_response","order",200);
      // Only the authenticated order response can supply the subscription ID.
      if (typeof order.subscription !== "string") return {order, subscription:null};
      let subscriptionId:string;
      try {subscriptionId=orderUuid(order.subscription);}catch{throw new CaktoReadError("invalid_response","order",200);}
      const subscription = await json(`subscriptions/${subscriptionId}/`, options, 1024 * 1024,"subscription");
      if (subscription.id !== subscriptionId) throw new CaktoReadError("invalid_response","subscription",200);
      return {order, subscription};
    },
  };
}
