export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Configure as variáveis públicas do Supabase em .env.local.");
  }

  if (!publishableKey.startsWith("sb_publishable_")) {
    throw new Error("Use somente a chave publishable na configuração pública do Supabase.");
  }

  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password) {
    throw new Error("A URL do projeto Supabase deve usar HTTPS, sem credenciais.");
  }

  return { url: parsedUrl.origin, publishableKey };
}
