import {createCipheriv, createDecipheriv, createHash, randomBytes, scrypt} from "node:crypto";

const settings = {N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024};
const context = Buffer.from("MetaAprovacao backup recovery v1");
function derive(password: string, salt: Uint8Array): Promise<Buffer> {
  if (password.length < 16 || password.length > 256) throw Error("invalid_recovery_password");
  return new Promise((resolve, reject) => scrypt(password.normalize("NFC"), salt, 32, settings,
    (error, key) => error ? reject(Error("recovery_key_unavailable")) : resolve(key)));
}
export function backupKeyId(key: Uint8Array) {
  if (key.length !== 32) throw Error("invalid_backup_key");
  return createHash("sha256").update(key).digest("hex");
}
export async function sealRecoveryKey(key: Uint8Array, password: string) {
  const keyId = backupKeyId(key), salt = randomBytes(32), nonce = randomBytes(12);
  const wrapping = await derive(password, salt);
  try {
    const cipher = createCipheriv("aes-256-gcm", wrapping, nonce);
    cipher.setAAD(context);
    const ciphertext = Buffer.concat([cipher.update(key), cipher.final()]);
    return {version: 1, keyId, kdf: "scrypt", N: settings.N, r: settings.r, p: settings.p,
      salt: salt.toString("base64"), nonce: nonce.toString("base64"),
      ciphertext: ciphertext.toString("base64"), tag: cipher.getAuthTag().toString("base64")};
  } finally {wrapping.fill(0);}
}
export async function openRecoveryKey(value: unknown, password: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("invalid_recovery_envelope");
  const envelope = value as Record<string, unknown>;
  if (envelope.version !== 1 || envelope.kdf !== "scrypt" || envelope.N !== settings.N || envelope.r !== settings.r || envelope.p !== settings.p) throw Error("invalid_recovery_envelope");
  if (typeof envelope.keyId !== "string" || !/^[a-f0-9]{64}$/.test(envelope.keyId)) throw Error("invalid_recovery_envelope");
  function bytes(field: string, size: number) {
    const text = envelope[field];
    if (typeof text !== "string" || text.length > 64) throw Error("invalid_recovery_envelope");
    const result = Buffer.from(text, "base64");
    if (result.length !== size || result.toString("base64") !== text) throw Error("invalid_recovery_envelope");
    return result;
  }
  const salt = bytes("salt", 32), nonce = bytes("nonce", 12), tag = bytes("tag", 16), ciphertext = bytes("ciphertext", 32);
  const wrapping = await derive(password, salt);
  try {
    const cipher = createDecipheriv("aes-256-gcm", wrapping, nonce);
    cipher.setAAD(context);
    cipher.setAuthTag(tag);
    const key = Buffer.concat([cipher.update(ciphertext), cipher.final()]);
    if (backupKeyId(key) !== envelope.keyId) {key.fill(0); throw Error("invalid_recovery_envelope");}
    return key;
  } catch {throw Error("recovery_password_or_file_invalid");}
  finally {wrapping.fill(0);}
}
