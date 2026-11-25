import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { NextRequest } from "next/server.js";
import { handleAdminProxy as middleware } from "../src/lib/admin/auth/proxy.ts";
import { adminSessionCookieOptions, revalidateAdminSession, signSessionToken, verifySessionToken } from "../src/lib/admin/auth/session.ts";
import { adminWriteError } from "../src/lib/admin/auth/request.ts";

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

describe("Proteções da sessão administrativa", () => {
  const claims = { adminId: "admin-test", nome: "Nome anterior", email: "antigo@example.test", papel: "super_admin" };
  const account = { id: claims.adminId, ativo: true, nome: "Nome atual", email: "atual@example.test", papel: claims.papel };

  it("consulta a autorização atual e mantém o prazo original da sessão", async () => {
    const session = await verifySessionToken(await signSessionToken(claims));
    assert.ok(session);
    const current = await revalidateAdminSession(session, async id => {
      assert.equal(id, account.id);
      return account;
    });
    assert.deepEqual(current, { ...session, nome: account.nome, email: account.email });
    assert.equal(await revalidateAdminSession(session, async () => null), null);
    assert.equal(await revalidateAdminSession(session, async () => ({ ...account, ativo: false })), null);
    assert.equal(await revalidateAdminSession(session, async () => ({ ...account, papel: "suporte" })), null);
  });

  it("encaminha a página de login para a verificação atual do servidor", async () => {
    const token = await signSessionToken(claims);
    const response = await middleware(new NextRequest("http://localhost:3000/admin/login", {
      headers: { cookie: `meta_admin_session=${token}` },
    }));
    assert.equal(response.status, 200);
  });

  it("exige origem configurada para alterações e segredo forte em produção", async t => {
    const previous = new Map(["NODE_ENV", "APP_ORIGIN", "SESSION_SECRET"].map(key => [key, process.env[key]]));
    t.after(() => {
      for (const [key, value] of previous) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
    const token = await signSessionToken(claims);
    process.env.NODE_ENV = "production";
    process.env.APP_ORIGIN = "https://study.example";
    delete process.env.SESSION_SECRET;
    assert.equal(await verifySessionToken(token), null);
    await assert.rejects(signSessionToken(claims), /Configuração indisponível/);
    assert.deepEqual(adminSessionCookieOptions(), {
      httpOnly: true, sameSite: "strict", secure: true, path: "/",
    });

    const write = headers => new Request("https://study.example/api/admin/profile", { method: "PUT", headers });
    assert.equal(adminWriteError(write({ origin: "https://study.example" })), undefined);
    assert.equal(adminWriteError(write({ origin: "https://other.example" }))?.status, 403);
    assert.equal(adminWriteError(write({ origin: "https://study.example", "sec-fetch-site": "cross-site" }))?.status, 403);
    assert.equal(adminWriteError(write({}))?.headers.get("Cache-Control"), "private, no-store, max-age=0");
  });
});
