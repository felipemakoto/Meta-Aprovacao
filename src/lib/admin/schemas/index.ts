import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export const grantPremiumSchema = z
  .object({
    durationType: z.enum(["7", "30", "90", "365", "custom", "lifetime"]),
    customDate: z.string().optional(),
    reason: z
      .string()
      .trim()
      .min(5, "O motivo deve ter pelo menos 5 caracteres.")
      .max(300, "O motivo deve ter no máximo 300 caracteres."),
    confirmCaktoConflict: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.durationType === "custom") {
      if (!data.customDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customDate"],
          message: "Selecione uma data de expiração.",
        });
      } else {
        const parsed = new Date(data.customDate);
        if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["customDate"],
            message: "A data personalizada deve ser futura.",
          });
        }
      }
    }
  });

export const extendPremiumSchema = z.object({
  days: z.enum(["7", "30", "90", "365"]),
  reason: z
    .string()
    .trim()
    .min(5, "O motivo deve ter pelo menos 5 caracteres.")
    .max(300, "O motivo deve ter no máximo 300 caracteres."),
});

export const sensitiveReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "O motivo obrigatório deve ter pelo menos 5 caracteres.")
    .max(300, "O motivo deve ter no máximo 300 caracteres."),
});

export const deleteUserLgpdSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "O motivo obrigatório deve ter pelo menos 5 caracteres.")
    .max(300, "O motivo deve ter no máximo 300 caracteres."),
  confirmationText: z
    .string()
    .trim()
    .refine((val) => val === "EXCLUIR LGPD", {
      message: 'Digite exatamente "EXCLUIR LGPD" para confirmar.',
    }),
  protocolNumber: z.string().trim().min(1, "Informe o número do protocolo LGPD.").optional(),
  adminPassword: z.string().min(1, "Digite sua senha de administrador para confirmar a exclusão."),
});

export const addNoteSchema = z.object({
  conteudo: z
    .string()
    .trim()
    .min(3, "A nota deve ter pelo menos 3 caracteres.")
    .max(500, "A nota deve ter no máximo 500 caracteres."),
});

export const createAdminSchema = z.object({
  nome: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres."),
  email: z.string().trim().email("Informe um e-mail válido."),
  papel: z.enum(["super_admin", "suporte", "financeiro"]),
});

export const updateAdminSchema = z.object({
  papel: z.enum(["super_admin", "suporte", "financeiro"]),
});

export const updateSettingsSchema = z.object({
  planos: z
    .array(
      z.object({
        id: z.string(),
        nome: z.string().trim().min(2, "Nome do plano obrigatório."),
        valorCentavos: z
          .number()
          .int()
          .min(0, "O valor não pode ser negativo.")
          .max(1000000, "Valor acima do limite permitido."),
        duracaoDias: z.number().int().positive().nullable(),
        ativo: z.boolean(),
      })
    )
    .min(1),
  featureFlags: z.array(
    z.object({
      chave: z.string(),
      nome: z.string(),
      descricao: z.string(),
      ativo: z.boolean(),
    })
  ),
  modoManutencao: z.boolean(),
  mensagemManutencao: z
    .string()
    .trim()
    .min(5, "Informe a mensagem exibida durante a manutenção.")
    .max(240),
});
