import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./config";

export async function createClient(onServerTime?: (seconds: number) => void) {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseConfig();

  return createServerClient(url, publishableKey, {
    global: onServerTime ? {
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        // HTTPS response from the configured provider is the clock authority for recovery.
        const seconds = Date.parse(response.headers.get("date") ?? "") / 1000;
        if (Number.isFinite(seconds)) onServerTime(seconds);
        return response;
      },
    } : undefined,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components não escrevem cookies. O Proxy renova a sessão
          // nessas rotas; Route Handlers e Server Actions podem gravá-los.
        }
      },
    },
  });
}
