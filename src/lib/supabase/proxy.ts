import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Respostas ligadas à sessão nunca devem ser compartilhadas por caches.
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousResponse = response;
        response = NextResponse.next({ request });
        for (const name of ["Cache-Control", "Pragma", "Expires"]) {
          const value = previousResponse.headers.get(name);
          if (value) response.headers.set(name, value);
        }
        previousResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  // Renova cookies; a identidade será verificada novamente em cada operação.
  // Ausência de sessão não redireciona a entrada pública para um login futuro.
  await supabase.auth.getClaims();
  return response;
}
