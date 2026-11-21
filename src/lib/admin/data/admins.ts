import { assertCan } from "../rbac";
import { createAdminSchema, updateAdminSchema } from "../schemas";
import type { AdminAccount, AdminRole, SessionPayload } from "../types";
import { recordAuditLog } from "./audit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function listAdmins(actorRole: AdminRole): Promise<AdminAccount[]> {
  assertCan(actorRole, "admins:view");

  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      return data.map((u) => ({
        id: u.id,
        nome: u.name,
        email: u.email,
        papel: u.role as AdminRole,
        ativo: u.is_active,
        ultimoAcessoEm: null,
        criadoEm: u.created_at,
      }));
    }
  } catch (err) {
    console.error("[listAdmins] Erro ao buscar administradores:", err);
  }

  return [];
}

export async function createAdmin(
  actor: SessionPayload,
  input: unknown,
  ipSimulado = "127.0.0.1"
): Promise<AdminAccount> {
  assertCan(actor.papel, "admins:manage");
  const parsed = createAdminSchema.parse(input);
  const adminClient = createAdminClient();

  // 1. Verifica se já existe em admin_users
  const { data: existingAdmin } = await adminClient
    .from("admin_users")
    .select("id")
    .eq("email", parsed.email.toLowerCase())
    .maybeSingle();

  if (existingAdmin) {
    throw new Error("Já existe um administrador cadastrado com este e-mail.");
  }

  // 2. Busca ou cria usuário no Supabase Auth
  const { data: authList } = await adminClient.auth.admin.listUsers();
  let authUser = authList?.users.find(
    (u) => u.email?.toLowerCase() === parsed.email.toLowerCase()
  );

  if (!authUser) {
    const { data: newAuth, error: createAuthErr } = await adminClient.auth.admin.createUser({
      email: parsed.email.toLowerCase(),
      email_confirm: true,
      user_metadata: { name: parsed.nome },
    });
    if (createAuthErr || !newAuth.user) {
      throw new Error(createAuthErr?.message ?? "Erro ao criar usuário no Supabase Auth.");
    }
    authUser = newAuth.user;
  }

  // 3. Insere na tabela admin_users
  const { data: inserted, error: insertErr } = await adminClient
    .from("admin_users")
    .insert({
      id: authUser.id,
      email: parsed.email.toLowerCase(),
      name: parsed.nome,
      role: parsed.papel,
      is_active: true,
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    throw new Error(insertErr?.message ?? "Erro ao registrar administrador na tabela.");
  }

  const newAdmin: AdminAccount = {
    id: inserted.id,
    nome: inserted.name,
    email: inserted.email,
    papel: inserted.role as AdminRole,
    ativo: inserted.is_active,
    ultimoAcessoEm: null,
    criadoEm: inserted.created_at,
  };

  await recordAuditLog({
    adminId: actor.adminId,
    adminNome: actor.nome,
    adminEmail: actor.email,
    acao: "admin_created",
    descricao: `Administrador "${newAdmin.nome}" (${newAdmin.papel}) criado.`,
    ipSimulado,
    usuarioAfetadoId: newAdmin.id,
    usuarioAfetadoNome: newAdmin.nome,
  });

  return newAdmin;
}

export async function updateAdminRole(
  actor: SessionPayload,
  targetAdminId: string,
  input: unknown,
  ipSimulado = "127.0.0.1"
): Promise<AdminAccount> {
  assertCan(actor.papel, "admins:manage");
  const parsed = updateAdminSchema.parse(input);
  const adminClient = createAdminClient();

  const { data: target, error: fetchErr } = await adminClient
    .from("admin_users")
    .select("*")
    .eq("id", targetAdminId)
    .single();

  if (fetchErr || !target) {
    throw new Error("Administrador não encontrado.");
  }

  const oldRole = target.role;
  const { data: updated, error: updateErr } = await adminClient
    .from("admin_users")
    .update({ role: parsed.papel, updated_at: new Date().toISOString() })
    .eq("id", targetAdminId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error("Erro ao atualizar papel do administrador.");
  }

  await recordAuditLog({
    adminId: actor.adminId,
    adminNome: actor.nome,
    adminEmail: actor.email,
    acao: "admin_updated",
    descricao: `Papel de "${updated.name}" alterado de ${oldRole} para ${parsed.papel}.`,
    ipSimulado,
    usuarioAfetadoId: targetAdminId,
    usuarioAfetadoNome: updated.name,
  });

  return {
    id: updated.id,
    nome: updated.name,
    email: updated.email,
    papel: updated.role as AdminRole,
    ativo: updated.is_active,
    ultimoAcessoEm: null,
    criadoEm: updated.created_at,
  };
}

export async function toggleAdminStatus(
  actor: SessionPayload,
  targetAdminId: string,
  ipSimulado = "127.0.0.1"
): Promise<AdminAccount> {
  assertCan(actor.papel, "admins:manage");

  if (targetAdminId === actor.adminId) {
    throw new Error("Você não pode desativar sua própria conta de administrador.");
  }

  const adminClient = createAdminClient();

  const { data: target, error: fetchErr } = await adminClient
    .from("admin_users")
    .select("*")
    .eq("id", targetAdminId)
    .single();

  if (fetchErr || !target) {
    throw new Error("Administrador não encontrado.");
  }

  const newStatus = !target.is_active;

  const { data: updated, error: updateErr } = await adminClient
    .from("admin_users")
    .update({ is_active: newStatus, updated_at: new Date().toISOString() })
    .eq("id", targetAdminId)
    .select()
    .single();

  if (updateErr || !updated) {
    throw new Error("Erro ao alterar status do administrador.");
  }

  await recordAuditLog({
    adminId: actor.adminId,
    adminNome: actor.nome,
    adminEmail: actor.email,
    acao: "admin_toggled",
    descricao: `Conta de "${updated.name}" ${newStatus ? "reativada" : "desativada"}.`,
    ipSimulado,
    usuarioAfetadoId: targetAdminId,
    usuarioAfetadoNome: updated.name,
  });

  return {
    id: updated.id,
    nome: updated.name,
    email: updated.email,
    papel: updated.role as AdminRole,
    ativo: updated.is_active,
    ultimoAcessoEm: null,
    criadoEm: updated.created_at,
  };
}
