import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculatePremiumExpiration,
  checkCaktoConflict,
} from "../src/lib/admin/domain/premium.ts";

describe("Domínio Premium — cálculo de expiração", () => {
  const fixedNow = new Date("2026-11-17T12:00:00.000Z");

  it("calcula expiração para 7, 30, 90 e 365 dias a partir de agora", () => {
    const r7 = calculatePremiumExpiration({ mode: "days", days: 7 }, fixedNow);
    assert.equal(r7.vitalicio, false);
    assert.equal(r7.expiraEm, "2026-11-24T12:00:00.000Z");

    const r30 = calculatePremiumExpiration({ mode: "days", days: 30 }, fixedNow);
    assert.equal(r30.expiraEm, "2026-12-17T12:00:00.000Z");

    const r365 = calculatePremiumExpiration({ mode: "days", days: 365 }, fixedNow);
    assert.equal(r365.expiraEm, "2027-11-17T12:00:00.000Z");
  });

  it("estende a partir da data futura existente quando extendFromIso é informado", () => {
    const currentExpiry = "2026-12-01T12:00:00.000Z";
    const extended = calculatePremiumExpiration(
      { mode: "days", days: 30 },
      fixedNow,
      currentExpiry
    );
    assert.equal(extended.expiraEm, "2026-12-31T12:00:00.000Z");
  });

  it("suporta acesso vitalício com expiraEm nulo", () => {
    const lifetime = calculatePremiumExpiration({ mode: "lifetime" }, fixedNow);
    assert.equal(lifetime.vitalicio, true);
    assert.equal(lifetime.expiraEm, null);
  });

  it("rejeita data personalizada no passado", () => {
    assert.throws(() =>
      calculatePremiumExpiration(
        { mode: "custom", customDateIso: "2026-11-01T00:00:00.000Z" },
        fixedNow
      )
    );
  });
});

describe("Regra de conflito Cakto ativa", () => {
  it("exibe aviso quando o usuário tem assinatura Cakto ativa", () => {
    const check = checkCaktoConflict(
      [
        { id: "SUB-1", userId: "USR-0001", origem: "cakto", status: "ativa" },
        { id: "SUB-2", userId: "USR-0002", origem: "manual", status: "ativa" },
      ],
      "USR-0001"
    );
    assert.equal(check.hasActiveCakto, true);
    assert.equal(check.activeSubscriptionId, "SUB-1");
    assert.ok(check.warningMessage?.includes("Cakto"));
  });

  it("não exibe aviso quando a assinatura Cakto está cancelada ou é manual", () => {
    const canceled = checkCaktoConflict(
      [{ id: "SUB-1", userId: "USR-0001", origem: "cakto", status: "cancelada" }],
      "USR-0001"
    );
    assert.equal(canceled.hasActiveCakto, false);

    const manual = checkCaktoConflict(
      [{ id: "SUB-2", userId: "USR-0002", origem: "manual", status: "ativa" }],
      "USR-0002"
    );
    assert.equal(manual.hasActiveCakto, false);
  });
});
