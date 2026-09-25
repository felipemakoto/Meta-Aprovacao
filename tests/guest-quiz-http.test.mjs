import assert from "node:assert/strict";
import test from "node:test";

const base = process.env.GUEST_TEST_BASE_URL ?? "http://127.0.0.1:3000";
const endpoint = `${base}/api/quiz/attempt`;
async function call(method, headers = {}, body) {
  return fetch(endpoint, {
    method, headers, ...(body === undefined ? {} : { body }),
    signal: AbortSignal.timeout(15000), redirect: "manual",
  });
}

test("HTTP real: leitura sem token ou com cookie malformado é rejeitada", async () => {
  for (const headers of [{}, { Cookie: "guest_quiz=invalid" }]) {
    const response = await call("GET", headers);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "attempt_unavailable" });
    assert.match(response.headers.get("cache-control"), /private.*no-store/);
  }
});

test("HTTP real: criação sem origem ou de outro site é bloqueada", async () => {
  for (const headers of [{}, { Origin: "https://other.example" }]) {
    const response = await call("POST", headers);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("set-cookie"), null);
  }
});

test("HTTP real: payload escolhido pelo cliente é rejeitado", async () => {
  assert.equal((await call("POST", { Origin: base, "Content-Type": "application/json" }, '{"questionId":"forged"}')).status, 400);
});

test("HTTP real: Supabase recusa iniciar quiz com o lote ainda em rascunho", {
  skip: !process.env.SUPABASE_SECRET_KEY ? "Configure SUPABASE_SECRET_KEY localmente para testar a integração privilegiada." : false,
}, async () => {
  const response = await call("POST", { Origin: base });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "quiz_not_ready" });
  assert.equal(response.headers.get("set-cookie"), null);
});

test("API pública não permite chamar RPCs privilegiadas", async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.ok(url && key);
  for (const name of ["start_guest_quiz", "read_guest_quiz"]) {
    const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
      method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
      body: JSON.stringify({ p_token_hash: "c".repeat(64) }), signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    assert.ok([401, 403, 404].includes(response.status));
    assert.ok(["42501", "PGRST202"].includes(body.code));
  }
});
