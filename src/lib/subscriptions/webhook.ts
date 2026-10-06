import { createHmac, timingSafeEqual } from "node:crypto";

const events = new Set(["purchase_approved", "purchase_refused", "refund", "refund_requested", "chargeback", "subscription_created", "subscription_canceled", "subscription_renewed", "subscription_renewal_refused", "subscription_paused", "subscription_resumed", "subscription_late", "subscription_late_recovered"]);
export type InboxEvent = { event: string; orderId: string; productId: string; offerId: string; status: string; subscriptionId: string | null; reference: string | null; paidAt: string | null; refundedAt: string | null; chargedbackAt: string | null; canceledAt: string | null };
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("invalid_payload");
  return value as Record<string, unknown>;
}
function id(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,200}$/.test(value)) throw Error("invalid_payload");
  return value;
}
function date(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length > 64 || !Number.isFinite(Date.parse(value))) throw Error("invalid_payload");
  return new Date(value).toISOString();
}
export function signatureDiagnostic(raw: Uint8Array, headers: Headers, secret: string, now: number) {
  const timestamp = headers.get("x-cakto-timestamp") ?? "";
  const signatures = (headers.get("x-cakto-signature") ?? "").split(",").map(s => s.trim());
  const timestampPresent = headers.has("x-cakto-timestamp"), signaturePresent = headers.has("x-cakto-signature");
  const timestampFormatValid = /^\d{10}$/.test(timestamp);
  const signatureFormatValid = signatures.some(s => /^v1=[a-fA-F0-9]{64}$/.test(s));
  const clockWithinTolerance = timestampFormatValid && Number.isFinite(now) ? Math.abs(now / 1000 - Number(timestamp)) <= 300 : null;
  const details = { timestampPresent, signaturePresent, timestampFormatValid, signatureFormatValid, clockWithinTolerance };
  if (!timestampPresent || !signaturePresent) return { ...details, reason: "missing_signature_headers", valid: false };
  if (!timestampFormatValid || !signatureFormatValid) return { ...details, reason: "invalid_signature_format", valid: false };
  if (!clockWithinTolerance) return { ...details, reason: "timestamp_outside_tolerance", valid: false };
  const expected = createHmac("sha256", secret).update(`${timestamp}.`).update(raw).digest();
  const valid = signatures.some(s => /^v1=[a-fA-F0-9]{64}$/.test(s) && timingSafeEqual(expected, Buffer.from(s.slice(3), "hex")));
  return { ...details, reason: valid ? "signature_verified" : "signature_mismatch", valid };
}
export function signatureValid(raw: Uint8Array, headers: Headers, secret: string, now: number): boolean {
  return signatureDiagnostic(raw, headers, secret, now).valid;
}
export function inboxEvents(value: unknown, product: string, offers: string[]): InboxEvent[] {
  const envelope = object(value);
  if (typeof envelope.event !== "string" || !events.has(envelope.event)) throw Error("unsupported_event");
  const records = Array.isArray(envelope.data) ? envelope.data : [envelope.data];
  if (!records.length || records.length > 25) throw Error("invalid_payload");
  return records.map(value => {
    const data = object(value);
    const productId = id(object(data.product).id), offerId = id(object(data.offer).id);
    if (productId !== product || !offers.includes(offerId)) throw Error("foreign_offer");
    const status = id(data.status);
    const subscriptionId = data.subscription == null ? null : id(object(data.subscription).id);
    // Rastreamento é candidato ao vínculo, nunca prova de identidade ou pagamento.
    const reference = typeof data.sck === "string" && /^[a-f0-9]{64}$/.test(data.sck) ? data.sck : null;
    return { event: envelope.event as string, orderId: id(data.id), productId, offerId, status, subscriptionId, reference,
      paidAt: date(data.paidAt), refundedAt: date(data.refundedAt), chargedbackAt: date(data.chargedbackAt), canceledAt: date(data.canceledAt) };
  });
}
class HttpError extends Error { status: number; constructor(status: number) { super("webhook_rejected"); this.status = status; } }
async function readBody(request: Request): Promise<Uint8Array> {
  const limit = 256 * 1024;
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > limit)) throw new HttpError(413);
  if (!request.body) throw new HttpError(400);
  const reader = request.body.getReader();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([ (async () => {
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength; if (size > limit) throw new HttpError(413);
        chunks.push(value);
      }
      return Buffer.concat(chunks);
    })(), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new HttpError(408)), 3000); }) ]);
  } finally { clearTimeout(timer); void reader.cancel().catch(() => {}); }
}
export type WebhookDiagnostic = { status: number; reason: string; signature?: ReturnType<typeof signatureDiagnostic> };
export function webhookHandler(deps: { config: () => { secret: string; product: string; offers: string[] }; now: () => number; save: (events: InboxEvent[]) => Promise<void>; diagnose?: (diagnostic: WebhookDiagnostic) => void }) {
  return async (request: Request) => {
    let signature: ReturnType<typeof signatureDiagnostic> | undefined;
    const reply = (status: number, reason: string) => {
      // Only fixed reasons and booleans reach logs; never headers, payloads or errors.
      try { deps.diagnose?.({ status, reason, ...(signature ? { signature } : {}) }); } catch { /* Logging must not change delivery handling. */ }
      return Response.json({ received: status === 200 }, { status, headers: { "Cache-Control": "no-store" } });
    };
    try {
      const config = deps.config();
      if (!config.secret || !config.product || !config.offers.length || config.offers.some(o => !o)) return reply(503, "configuration_missing");
      if (new URL(request.url).search) return reply(400, "query_rejected");
      if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return reply(415, "content_type_rejected");
      if (request.headers.has("content-encoding")) return reply(415, "content_encoding_rejected");
      const raw = await readBody(request);
      signature = signatureDiagnostic(raw, request.headers, config.secret, deps.now());
      if (!signature.valid) return reply(401, signature.reason);
      let parsed: unknown;
      try { parsed = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)); } catch { return reply(400, "invalid_json"); }
      let records: InboxEvent[];
      try { records = inboxEvents(parsed, config.product, config.offers); } catch (error) { return reply(400, error instanceof Error && error.message === "foreign_offer" ? "product_or_offer_rejected" : "payload_rejected"); }
      await deps.save(records);
      return reply(200, "persisted");
    } catch (error) { return reply(error instanceof HttpError ? error.status : 503, error instanceof HttpError ? "body_rejected" : "processing_failed"); }
  };
}
