import assert from "node:assert/strict";
import test from "node:test";

const appUrl = process.env.AUTH_TEST_BASE_URL ?? "http://127.0.0.1:3000";
const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(projectUrl && publicKey, "Configure .env.local antes dos testes.");
const projectRef = new URL(projectUrl).hostname.split(".")[0];
const cookieName = `sb-${projectRef}-auth-token`;

async function checkRejected(cookie) {
  const response = await fetch(`${appUrl}/api/auth/status`, {
    headers: cookie ? { Cookie: cookie } : {},
    signal: AbortSignal.timeout(15000),
    redirect: "manual",
  });
  assert.equal(response.status, 401);
  assert.match(response.headers.get("cache-control"), /private.*no-store/);
  assert.deepEqual(await response.json(), { authenticated: false });
}

test("Supabase aceita a chave pública e responde ao healthcheck", async () => {
  const response = await fetch(`${projectUrl}/auth/v1/health`, {
    headers: { apikey: publicKey },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200);
});

test("entrada continua pública, sem redirecionamento para login", async () => {
  const response = await fetch(appUrl, { redirect: "manual" });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Começar teste grátis/);
});

test("servidor rejeita acesso sem sessão e impede cache", () => checkRejected());

test("cookie corrompido não autentica", () =>
  checkRejected(`${cookieName}=base64-nao-e-uma-sessao`),
);

test("sessão forjada com usuário e expiração futuros não autentica", async () => {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const userId = "00000000-0000-4000-8000-000000000001";
  const jwt = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    sub: userId, exp: expires, aud: "authenticated", role: "authenticated",
    iss: `${projectUrl}/auth/v1`,
  })}.${Buffer.alloc(32).toString("base64url")}`;
  const session = {
    access_token: jwt,
    refresh_token: "invalid-test-refresh-token",
    expires_at: expires,
    expires_in: 3600,
    token_type: "bearer",
    user: { id: userId, role: "authenticated" },
  };
  await checkRejected(`${cookieName}=base64-${encode(session)}`);
});
