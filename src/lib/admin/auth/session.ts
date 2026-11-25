import type { AdminAccount, SessionPayload } from "../types";
import { isAdminRole } from "../rbac.ts";

export const SESSION_COOKIE_NAME = "meta_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 2; // Expiração curta: 2 horas

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
    throw new Error("Configuração indisponível para sessões administrativas.");
  }
  if (!secret || secret.length < 16) {
    // Em ambiente local sem .env.local configurado, gera um segredo efêmero em memória
    // para evitar falha de inicialização, mas em produção SESSION_SECRET é obrigatório.
    const g = globalThis as unknown as { __metaEphemeralSecret?: string };
    if (!g.__metaEphemeralSecret) {
      g.__metaEphemeralSecret = crypto.randomUUID() + "-" + crypto.randomUUID();
    }
    return g.__metaEphemeralSecret;
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Assina o cookie do painel após a autenticação e autorização da conta no Supabase. */
export async function signSessionToken(
  payload: Omit<SessionPayload, "exp">
): Promise<string> {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const dataBytes = new TextEncoder().encode(JSON.stringify(fullPayload));
  const dataB64 = toBase64Url(dataBytes);

  const key = await importHmacKey(getSessionSecret());
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(dataB64)
  );
  const sigB64 = toBase64Url(new Uint8Array(sigBuffer));
  return `${dataB64}.${sigB64}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token || token.length > 4096) return null;
  const parts = /^([\w-]+)\.([\w-]{43})$/.exec(token);
  if (!parts) return null;
  const [, dataB64, sigB64] = parts;

  try {
    const key = await importHmacKey(getSessionSecret());
    const sigBytes = fromBase64Url(sigB64);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes.buffer as ArrayBuffer,
      new TextEncoder().encode(dataB64)
    );
    if (!valid) return null;

    const json = new TextDecoder().decode(fromBase64Url(dataB64));
    const parsed = JSON.parse(json) as Partial<SessionPayload> | null;
    if (
      !parsed || typeof parsed.adminId !== "string" || !parsed.adminId ||
      typeof parsed.nome !== "string" || typeof parsed.email !== "string" ||
      !isAdminRole(parsed.papel) || typeof parsed.exp !== "number" ||
      !Number.isSafeInteger(parsed.exp) || parsed.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    return { adminId: parsed.adminId, nome: parsed.nome, email: parsed.email, papel: parsed.papel, exp: parsed.exp };
  } catch {
    return null;
  }
}

export async function revalidateAdminSession(
  session: SessionPayload | null,
  readAdmin: (id: string) => Promise<Pick<AdminAccount, "id" | "ativo" | "papel" | "nome" | "email"> | null>
): Promise<SessionPayload | null> {
  if (!session) return null;
  const admin = await readAdmin(session.adminId);
  if (!admin?.ativo || admin.id !== session.adminId || admin.papel !== session.papel) return null;
  return { ...session, nome: admin.nome, email: admin.email };
}
