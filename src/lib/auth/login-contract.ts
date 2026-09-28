export type LoginInput = { email: string; password: string };
export function parseLogin(value: unknown): LoginInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).length !== 2 || typeof input.email !== "string" || typeof input.password !== "string") return null;
  const email = input.email.trim();
  // Login accepts existing passwords without applying signup's strength rules.
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !input.password || new TextEncoder().encode(input.password).length > 1024) return null;
  return { email, password: input.password };
}
