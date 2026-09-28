export type SignupInput = { email: string; password: string; confirmPassword: string };
export type SignupField = keyof SignupInput;
export type SignupErrors = Partial<Record<SignupField, string>>;

export function validateSignup(input: SignupInput): SignupErrors {
  const errors: SignupErrors = {};
  if (input.email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) errors.email = "Informe um e-mail válido.";
  if (input.password.length < 8) errors.password = "A senha está muito curta.";
  else if (new TextEncoder().encode(input.password).length > 72) errors.password = "Use uma senha mais curta (até 72 bytes).";
  if (!input.confirmPassword || input.password !== input.confirmPassword) errors.confirmPassword = "As senhas precisam ser iguais.";
  return errors;
}

export function parseSignup(value: unknown): SignupInput | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const object = value as Record<string, unknown>;
  const fields = ["email", "password", "confirmPassword"];
  if (Object.keys(object).length !== 3 || !fields.every(key => typeof object[key] === "string")) return null;
  const input = object as SignupInput;
  if (Object.keys(validateSignup(input)).length) return null;
  return { ...input, email: input.email.trim() };
}
