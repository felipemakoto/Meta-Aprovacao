import { assertCan } from "../rbac";
import { updateSettingsSchema } from "../schemas";
import type { AdminRole, PlatformSettings, SessionPayload } from "../types";
import { recordAuditLog } from "./audit";
import { getStore } from "./store";

export async function getSettings(actorRole: AdminRole): Promise<PlatformSettings> {
  assertCan(actorRole, "settings:view");
  const store = getStore();
  // SUPABASE: await supabase.from("platform_settings").select("*").single();
  return structuredClone(store.settings);
}

export async function updateSettings(
  actor: SessionPayload,
  input: unknown,
  ipSimulado = "127.0.0.1"
): Promise<PlatformSettings> {
  assertCan(actor.papel, "settings:manage_prices");
  assertCan(actor.papel, "settings:manage_flags");
  assertCan(actor.papel, "settings:manage_maintenance");

  const parsed = updateSettingsSchema.parse(input);
  const store = getStore();
  const prevMaintenance = store.settings.modoManutencao;

  // SUPABASE: await supabase.from("platform_settings").upsert({ ...parsed, atualizado_por: actor.nome });
  store.settings = {
    ...parsed,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: actor.nome,
  };

  if (prevMaintenance !== parsed.modoManutencao) {
    await recordAuditLog({
      adminId: actor.adminId,
      adminNome: actor.nome,
      adminEmail: actor.email,
      acao: "maintenance_toggled",
      descricao: `Modo de manutenção ${parsed.modoManutencao ? "ativado" : "desativado"}.`,
      ipSimulado,
      usuarioAfetadoId: null,
      usuarioAfetadoNome: null,
    });
  } else {
    await recordAuditLog({
      adminId: actor.adminId,
      adminNome: actor.nome,
      adminEmail: actor.email,
      acao: "settings_updated",
      descricao: "Preços, planos ou feature flags atualizados.",
      ipSimulado,
      usuarioAfetadoId: null,
      usuarioAfetadoNome: null,
    });
  }

  return structuredClone(store.settings);
}
