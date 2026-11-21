import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { can, assertCan } from "../src/lib/admin/rbac.ts";

describe("RBAC — Matriz de permissões dos papéis administrativos", () => {
  it("super_admin tem permissão total", () => {
    assert.equal(can("super_admin", "dashboard:view"), true);
    assert.equal(can("super_admin", "users:view"), true);
    assert.equal(can("super_admin", "users:grant_premium"), true);
    assert.equal(can("super_admin", "users:revoke_premium"), true);
    assert.equal(can("super_admin", "users:delete"), true);
    assert.equal(can("super_admin", "admins:manage"), true);
    assert.equal(can("super_admin", "settings:manage_prices"), true);
  });

  it("suporte pode gerenciar usuários e premium, mas não pode gerenciar admins ou preços", () => {
    assert.equal(can("suporte", "dashboard:view"), true);
    assert.equal(can("suporte", "users:view"), true);
    assert.equal(can("suporte", "users:grant_premium"), true);
    assert.equal(can("suporte", "users:revoke_premium"), true);
    assert.equal(can("suporte", "users:add_note"), true);

    // Proibições de suporte:
    assert.equal(can("suporte", "admins:view"), false);
    assert.equal(can("suporte", "admins:manage"), false);
    assert.equal(can("suporte", "users:delete"), false);
    assert.equal(can("suporte", "settings:manage_prices"), false);
  });

  it("financeiro pode visualizar assinaturas e auditoria, mas não edita usuários ou admins", () => {
    assert.equal(can("financeiro", "dashboard:view"), true);
    assert.equal(can("financeiro", "subscriptions:view"), true);
    assert.equal(can("financeiro", "audit:view"), true);
    assert.equal(can("financeiro", "audit:export"), true);

    // Proibições de financeiro:
    assert.equal(can("financeiro", "users:view"), false);
    assert.equal(can("financeiro", "users:grant_premium"), false);
    assert.equal(can("financeiro", "admins:manage"), false);
  });

  it("papel nulo, indefinido ou inválido não tem nenhuma permissão", () => {
    assert.equal(can(null, "dashboard:view"), false);
    assert.equal(can(undefined, "users:view"), false);
    // @ts-expect-error teste com papel arbitrário
    assert.equal(can("aluno", "dashboard:view"), false);
  });

  it("assertCan lança erro em violação de permissão", () => {
    assert.throws(() => assertCan("suporte", "admins:manage"), /Acesso negado/);
    assert.doesNotThrow(() => assertCan("super_admin", "admins:manage"));
  });
});
