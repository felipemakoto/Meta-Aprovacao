export type AdminRole = "super_admin" | "suporte" | "financeiro";

export type UserPlan = "gratis" | "premium";
export type UserStatus = "ativo" | "suspenso" | "excluido";
export type PremiumOrigin = "cakto" | "manual" | null;

export type SubscriptionStatus =
  | "ativa"
  | "cancelada"
  | "expirada"
  | "em_atraso";

export type SubscriptionOrigin = "cakto" | "manual";

export type SubjectArea =
  | "Matemática"
  | "Português"
  | "Ciências Humanas"
  | "Ciências da Natureza";

export interface UserSimulado {
  id: string;
  titulo: string;
  data: string; // ISO string
  tempoGastoMinutos: number;
  totalQuestoes: number;
  acertos: number;
  nota: number; // 0 a 10, coerente com acertos / totalQuestoes * 10
}

export interface UserTopicPerformance {
  materia: SubjectArea;
  assunto: string;
  totalRespondidas: number;
  acertos: number;
  erros: number;
}

export interface UserWrongQuestion {
  id: string;
  simuladoId: string;
  materia: SubjectArea;
  assunto: string;
  enunciadoResumo: string;
  data: string;
}

export interface UserLoginRecord {
  id: string;
  data: string;
  ip: string;
  dispositivo: string;
}

export interface AdminInternalNote {
  id: string;
  adminId: string;
  adminNome: string;
  conteudo: string;
  criadoEm: string;
}

export interface PlatformUser {
  id: string;
  nome: string;
  email: string;
  cpfMascarado: string; // Sempre mascarado: 123.***.***-09
  telefone: string;
  plano: UserPlan;
  status: UserStatus;
  origemPremium: PremiumOrigin;
  premiumInicioEm: string | null;
  premiumExpiraEm: string | null; // null quando vitalício ou grátis
  premiumVitalicio: boolean;
  criadoEm: string;
  ultimaAtividadeEm: string;
  simulados: UserSimulado[];
  desempenhoPorAssunto: UserTopicPerformance[];
  questoesErradas: UserWrongQuestion[];
  historicoLogins: UserLoginRecord[];
  notasInternas: AdminInternalNote[];
}

export interface SubscriptionRecord {
  id: string;
  userId: string;
  userNome: string;
  userEmail: string;
  planoNome: string;
  valorCentavos: number;
  status: SubscriptionStatus;
  origem: SubscriptionOrigin;
  externalId: string; // ID externo simulado (ex.: cak_9f8a2b1c ou man_3d1e4a)
  gatewayUrl: string | null; // Link para painel de gateway fictício
  inicioEm: string;
  expiraEm: string | null; // null se vitalício
  vitalicio: boolean;
  motivo?: string;
}

export interface AdminAccount {
  id: string;
  nome: string;
  email: string;
  papel: AdminRole;
  ativo: boolean;
  ultimoAcessoEm: string | null;
  criadoEm: string;
}

export type AuditActionType =
  | "login_success"
  | "login_failed"
  | "logout"
  | "premium_granted"
  | "premium_revoked"
  | "premium_extended"
  | "user_suspended"
  | "user_reactivated"
  | "user_password_reset"
  | "user_deleted_lgpd"
  | "user_note_added"
  | "admin_created"
  | "admin_updated"
  | "admin_toggled"
  | "settings_updated"
  | "maintenance_toggled"
  // Ações do painel admin (data layer)
  | "grant_premium"
  | "extend_premium"
  | "revoke_premium"
  | "suspend_user"
  | "reactivate_user"
  | "reset_password"
  | "delete_user_lgpd"
  | "add_note"
  | "admin_update_profile";

export interface AuditLogEntry {
  id: string;
  adminId: string | null;
  adminNome: string;
  adminEmail: string;
  acao: AuditActionType;
  descricao: string;
  motivo?: string;
  ipSimulado: string;
  usuarioAfetadoId: string | null;
  usuarioAfetadoNome: string | null;
  criadoEm: string;
}

export interface PlanPricing {
  id: string;
  nome: string;
  valorCentavos: number;
  duracaoDias: number | null;
  ativo: boolean;
}

export interface FeatureFlag {
  chave: string;
  nome: string;
  descricao: string;
  ativo: boolean;
}

export interface PlatformSettings {
  planos: PlanPricing[];
  featureFlags: FeatureFlag[];
  modoManutencao: boolean;
  mensagemManutencao: string;
  atualizadoEm: string;
  atualizadoPor: string;
}

export interface SessionPayload {
  adminId: string;
  nome: string;
  email: string;
  papel: AdminRole;
  exp: number;
}
