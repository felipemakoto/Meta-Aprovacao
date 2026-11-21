import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  loginSchema,
  createAdminSchema,
  grantPremiumSchema,
  addNoteSchema,
  deleteUserLgpdSchema,
} from "../src/lib/admin/schemas/index.ts";

describe("Schemas Zod do Painel Administrativo", () => {
  it("valida login com formato correto de e-mail e tamanho de senha", () => {
    const valid = loginSchema.safeParse({
      email: "admin@metaaprovacao.com.br",
      password: "MinhaSenhaForte@123",
    });
    assert.equal(valid.success, true);

    const invalidEmail = loginSchema.safeParse({
      email: "nao-eh-email",
      password: "123",
    });
    assert.equal(invalidEmail.success, false);
  });

  it("valida criação de novo administrador com papéis restritos", () => {
    const validSuper = createAdminSchema.safeParse({
      nome: "Diretoria",
      email: "diretoria@metaaprovacao.com.br",
      papel: "super_admin",
    });
    assert.equal(validSuper.success, true);

    const invalidRole = createAdminSchema.safeParse({
      nome: "Tentativa",
      email: "teste@metaaprovacao.com.br",
      papel: "hacker",
    });
    assert.equal(invalidRole.success, false);
  });

  it("exige motivo obrigatório com tamanho mínimo para concessão de premium", () => {
    const validGrant = grantPremiumSchema.safeParse({
      durationType: "30",
      reason: "Cortesia concedida pelo suporte após relato de instabilidade",
    });
    assert.equal(validGrant.success, true);

    const emptyReason = grantPremiumSchema.safeParse({
      durationType: "30",
      reason: "   ",
    });
    assert.equal(emptyReason.success, false);
  });

  it("rejeita notas internas vazias ou que excedam limite", () => {
    const validNote = addNoteSchema.safeParse({
      conteudo: "Aluno solicitou suporte com simulados de Português.",
    });
    assert.equal(validNote.success, true);

    const invalidNote = addNoteSchema.safeParse({
      conteudo: "",
    });
    assert.equal(invalidNote.success, false);
  });

  it("exige confirmação de senha do admin e texto exato para exclusão LGPD", () => {
    const validLgpd = deleteUserLgpdSchema.safeParse({
      reason: "Solicitação formal de exclusão de dados via suporte",
      confirmationText: "EXCLUIR LGPD",
      adminPassword: "minha-senha-admin",
    });
    assert.equal(validLgpd.success, true);

    const missingPassword = deleteUserLgpdSchema.safeParse({
      reason: "Solicitação formal de exclusão de dados via suporte",
      confirmationText: "EXCLUIR LGPD",
      adminPassword: "",
    });
    assert.equal(missingPassword.success, false);

    const wrongConfirmation = deleteUserLgpdSchema.safeParse({
      reason: "Solicitação formal de exclusão de dados via suporte",
      confirmationText: "excluir",
      adminPassword: "minha-senha-admin",
    });
    assert.equal(wrongConfirmation.success, false);
  });
});
