// Bound the complete streamed body, including streams whose cancellation never settles.
export class AuthBodyError extends Error {
  readonly status: 400 | 408 | 413;
  constructor(status: 400 | 408 | 413) {
    super(status === 408 ? "request_timeout" : "invalid_input");
    this.status = status;
  }
}

export async function readAuthJson(request: Request, limit: number): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new AuthBodyError(400);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const chunks: Uint8Array[] = [];
        let size = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > limit) throw new AuthBodyError(413);
          chunks.push(value);
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
        catch { throw new AuthBodyError(400); }
      })(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AuthBodyError(408)), 5000);
      }),
    ]);
  } catch (error) {
    throw error instanceof AuthBodyError ? error : new AuthBodyError(400);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
    try { reader.releaseLock(); } catch { /* A pending read must not delay the response. */ }
  }
}
