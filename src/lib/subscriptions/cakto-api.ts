// Server transport shared with local administrative scripts. No client imports.
export class CaktoReadError extends Error {
  constructor(reason: "configuration_missing" | "invalid_id" | "unavailable" | "unauthorized" | "not_found" | "rate_limited" | "invalid_response") { super(reason); }
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
  async function json(path: string, options: RequestInit, limit: number) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await transport(`https://api.cakto.com.br/public_api/${path}`, { ...options, redirect: "error", cache: "no-store", signal: controller.signal });
          if (!response.ok) {
            void response.body?.cancel().catch(() => {});
            throw new CaktoReadError([401,403].includes(response.status) ? "unauthorized" : response.status === 404 ? "not_found" : response.status === 429 ? "rate_limited" : "unavailable");
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
        new Promise<never>((_, reject) => { timer = setTimeout(() => {controller.abort(); reject(new CaktoReadError("unavailable"));}, 8000); }),
      ]);
    } catch (error) { throw error instanceof CaktoReadError ? error : new CaktoReadError("unavailable"); }
    finally { clearTimeout(timer); controller.abort(); void reader?.cancel().catch(() => {}); }
  }
  async function token() {
    const clientId = env.CAKTO_CLIENT_ID, secret = env.CAKTO_CLIENT_SECRET;
    if (!clientId || !secret) throw new CaktoReadError("configuration_missing");
    const result = await json("token/", {method:"POST", headers:{"Content-Type":"application/x-www-form-urlencoded"}, body:new URLSearchParams({client_id:clientId, client_secret:secret})}, 16384);
    if (typeof result.access_token !== "string" || !result.access_token || result.token_type !== "Bearer") throw new CaktoReadError("invalid_response");
    return result.access_token;
  }
  return {
    async orderAndSubscription(id: string) {
      orderUuid(id); // Validate before credentials or network access.
      const accessToken = await token();
      const options = {method:"GET", headers:{Authorization:`Bearer ${accessToken}`}};
      const order = await json(`orders/${id}/`, options, 1024 * 1024);
      if (order.id !== id) throw new CaktoReadError("invalid_response");
      // Only the authenticated order response can supply the subscription ID.
      if (typeof order.subscription !== "string") return {order, subscription:null};
      const subscriptionId = orderUuid(order.subscription);
      const subscription = await json(`subscriptions/${subscriptionId}/`, options, 1024 * 1024);
      if (subscription.id !== subscriptionId) throw new CaktoReadError("invalid_response");
      return {order, subscription};
    },
  };
}
