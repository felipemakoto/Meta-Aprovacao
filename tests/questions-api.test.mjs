import assert from "node:assert/strict";
import test from "node:test";

const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
assert.ok(projectUrl && publicKey, "Configure .env.local antes dos testes.");

test("chave pública válida não permite baixar questões ou gabaritos", async (t) => {
  const health = await fetch(`${projectUrl}/auth/v1/health`, {
    headers: { apikey: publicKey },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(health.status, 200, "A chave pública deve ser válida para testar a restrição.");

  for (const table of ["questions", "question_answers"]) {
    await t.test(`${table}: leitura direta bloqueada`, async () => {
      const response = await fetch(`${projectUrl}/rest/v1/${table}?select=*&limit=1`, {
        headers: { apikey: publicKey },
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.json();
      // Sem GRANT, PostgREST pode ocultar a tabela do schema cache do papel.
      assert.ok([401, 403, 404].includes(response.status), "A API deve rejeitar a leitura.");
      assert.ok(["42501", "PGRST205"].includes(body.code), "Esperado bloqueio de permissão ou tabela não exposta.");
      assert.equal(Array.isArray(body), false, "Não retornar lista de questões/gabaritos.");
    });
  }
});
