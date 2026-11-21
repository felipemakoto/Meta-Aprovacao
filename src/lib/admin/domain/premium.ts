import type { SubscriptionRecord } from "../types";

export type PremiumDurationOption =
  | { mode: "days"; days: 7 | 30 | 90 | 365 }
  | { mode: "custom"; customDateIso: string }
  | { mode: "lifetime" };

export interface PremiumExpirationResult {
  inicioEm: string;
  expiraEm: string | null;
  vitalicio: boolean;
}

/**
 * Calcula as datas de início e expiração do plano Premium.
 * Quando `extendFromIso` é informado e está no futuro, a extensão soma dias
 * a partir da data atual de expiração em vez de sobrescrever a partir de agora.
 */
export function calculatePremiumExpiration(
  option: PremiumDurationOption,
  now: Date = new Date(),
  extendFromIso?: string | null
): PremiumExpirationResult {
  const inicioEm = now.toISOString();

  if (option.mode === "lifetime") {
    return {
      inicioEm,
      expiraEm: null,
      vitalicio: true,
    };
  }

  if (option.mode === "custom") {
    const target = new Date(option.customDateIso);
    if (Number.isNaN(target.getTime())) {
      throw new Error("Data personalizada inválida para expiração do premium.");
    }
    if (target.getTime() <= now.getTime()) {
      throw new Error("A data personalizada deve ser posterior à data atual.");
    }
    return {
      inicioEm,
      expiraEm: target.toISOString(),
      vitalicio: false,
    };
  }

  const baseDate =
    extendFromIso && new Date(extendFromIso).getTime() > now.getTime()
      ? new Date(extendFromIso)
      : new Date(now.getTime());

  const expDate = new Date(baseDate.getTime());
  expDate.setUTCDate(expDate.getUTCDate() + option.days);

  return {
    inicioEm,
    expiraEm: expDate.toISOString(),
    vitalicio: false,
  };
}

export interface CaktoConflictCheck {
  hasActiveCakto: boolean;
  activeSubscriptionId: string | null;
  warningMessage: string | null;
}

/**
 * Regra de negócio: se o usuário possui uma assinatura Cakto ativa,
 * conceder premium manual exige confirmação explícita porque o gateway
 * continuará efetuando cobranças recorrentes.
 */
export function checkCaktoConflict(
  subscriptions: Pick<SubscriptionRecord, "id" | "userId" | "origem" | "status">[],
  userId: string
): CaktoConflictCheck {
  const activeCakto = subscriptions.find(
    (sub) =>
      sub.userId === userId &&
      sub.origem === "cakto" &&
      sub.status === "ativa"
  );

  if (!activeCakto) {
    return {
      hasActiveCakto: false,
      activeSubscriptionId: null,
      warningMessage: null,
    };
  }

  return {
    hasActiveCakto: true,
    activeSubscriptionId: activeCakto.id,
    warningMessage:
      "Este usuário possui uma assinatura Cakto ativa. Conceder premium manual não cancela a cobrança recorrente no gateway Cakto.",
  };
}
