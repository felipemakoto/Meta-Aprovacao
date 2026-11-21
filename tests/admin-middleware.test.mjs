import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server.js";
import { middleware } from "../middleware.ts";
import { signSessionToken } from "../src/lib/admin/auth/session.ts";

describe("Middleware e Proteção de Rotas Administrativas", () => {
  it("redireciona requisição anônima de /admin para /admin/login", async () => {
    const req = new NextRequest("http://localhost:3000/admin");
    const res = await middleware(req);
    assert.equal(res.status, 307);
    assert.ok(res.headers.get("location")?.endsWith("/admin/login"));
  });

  it("retorna 401 JSON para requisição anônima em /api/admin/*", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/users");
    const res = await middleware(req);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.ok(json.error?.includes("Não autenticado"));
  });

  it("permite acesso a /admin para usuário com sessão de admin", async () => {
    const token = await signSessionToken({
      adminId: "adm-1",
      nome: "Super Admin",
      email: "admin@metaaprovacao.com.br",
      papel: "super_admin",
    });

    const req = new NextRequest("http://localhost:3000/admin", {
      headers: {
        cookie: `meta_admin_session=${token}`,
      },
    });

    const res = await middleware(req);
    // NextResponse.next() retorna status 200
    assert.equal(res.status, 200);
  });

  it("bloqueia papel sem permissão e redireciona com erro", async () => {
    // papel 'financeiro' não tem permissão 'users:view'
    const token = await signSessionToken({
      adminId: "adm-fin",
      nome: "Financeiro",
      email: "fin@metaaprovacao.com.br",
      papel: "financeiro",
    });

    const req = new NextRequest("http://localhost:3000/admin/usuarios", {
      headers: {
        cookie: `meta_admin_session=${token}`,
      },
    });

    const res = await middleware(req);
    assert.equal(res.status, 307);
    assert.ok(res.headers.get("location")?.includes("erro=sem-permissao"));
  });
});
