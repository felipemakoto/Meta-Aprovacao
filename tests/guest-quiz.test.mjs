import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { createGuestQuizHandlers } from "../src/lib/quiz/http.ts";
import { toPublicQuiz } from "../src/lib/quiz/contract.ts";

const origin = "https://estudos.example";
const token = "a".repeat(64); // Identificador fictício para testar o transporte.
const fixture = {
  id: "attempt-test", startedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), questionCount: 10,
  questions: Array.from({ length: 10 }, (_, i) => ({
    position: i + 1, id: `q-${i}`, version: 1, subject: "matematica",
    topic: "Teste", statement: "Enunciado de teste", options: ["1", "2", "3", "4", "5"],
  })),
};
const request = (method, headers = {}, body, search = "") => new NextRequest(`${origin}/api/quiz/attempt${search}`, {
  method, headers: { Origin: origin, ...headers }, ...(body === undefined ? {} : { body }),
});
const makeHandlers = (changes = {}, settings = { secure: true, origin }) => createGuestQuizHandlers({
  read: async (value) => value === token ? fixture : null,
  start: async (value) => ({ quiz: fixture, token, created: value !== token }),
  isNotReady: (error) => error instanceof Error && error.message === "not-ready",
  ...changes,
}, settings);

test("criação usa cookie HttpOnly, Secure, SameSite e não revela token no JSON", async () => {
  const response = await makeHandlers().POST(request("POST"));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), fixture);
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /__Host-guest_quiz=/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /Secure/i);
  assert.match(cookie, /SameSite=strict/i);
  assert.match(cookie, /Path=\//i);
  assert.doesNotMatch(cookie, /Domain=/i);
  const maxAge = Number(cookie.match(/Max-Age=(\d+)/i)[1]);
  assert.ok(maxAge > 0 && maxAge <= 1800);
  assert.match(response.headers.get("cache-control"), /private.*no-store/);
});

test("retomada mantém tentativa e não reinicia prazo", async () => {
  const headers = { Cookie: `__Host-guest_quiz=${token}` };
  const handlers = makeHandlers();
  assert.equal((await handlers.POST(request("POST", headers))).status, 200);
  const read = await handlers.GET(request("GET", headers));
  assert.equal(read.status, 200);
  assert.deepEqual(await read.json(), fixture);
});

test("token ausente, inválido ou de outro visitante não permite leitura", async () => {
  for (const value of ["", "invalid", "b".repeat(64)]) {
    const response = await makeHandlers().GET(request("GET", { Cookie: `__Host-guest_quiz=${value}` }));
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: "attempt_unavailable" });
  }
});

test("origens externas e origem ausente não alcançam a DAL", async () => {
  let calls = 0;
  const handlers = makeHandlers({ start: async () => { calls++; throw new Error(); } });
  for (const headers of [{ Origin: "https://other.example" }, { Origin: "" }, { "Sec-Fetch-Site": "cross-site" }]) {
    assert.equal((await handlers.POST(request("POST", headers))).status, 403);
  }
  assert.equal(calls, 0);
  assert.equal((await handlers.GET(request("GET", { "Sec-Fetch-Site": "cross-site" }))).status, 403);
});

test("produção não aceita ausência de origem configurada nem HTTP", async () => {
  assert.equal((await makeHandlers({}, { secure: true }).POST(request("POST"))).status, 403);
  assert.equal((await makeHandlers({}, { secure: true, origin: "http://estudos.example" }).POST(request("POST"))).status, 403);
});

test("cliente não escolhe IDs, questões ou pontuação", async () => {
  const handlers = makeHandlers();
  assert.equal((await handlers.POST(request("POST", {}, '{"questionId":"q-1","score":10}'))).status, 400);
  assert.equal((await handlers.POST(request("POST", {}, undefined, "?id=other"))).status, 400);
  assert.equal((await handlers.GET(request("GET", {}, undefined, "?id=other"))).status, 400);
});

test("indisponibilidade não vaza erros internos nem grava cookie", async () => {
  for (const [message, expected] of [["not-ready", "quiz_not_ready"], ["internal sensitive details", "quiz_unavailable"]]) {
    const response = await makeHandlers({ start: async () => { throw new Error(message); } }).POST(request("POST"));
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: expected });
    assert.equal(response.headers.get("set-cookie"), null);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
});

test("DTO descarta gabarito, explicação e hash mesmo se vierem da consulta", () => {
  const dirty = structuredClone(fixture);
  dirty.token_hash = "private-hash";
  dirty.questions[0].correct_answer = "B";
  dirty.questions[0].explanation = "Private explanation";
  assert.deepEqual(toPublicQuiz(dirty), fixture);
  assert.throws(() => toPublicQuiz({ ...fixture, questions: [] }));
});
