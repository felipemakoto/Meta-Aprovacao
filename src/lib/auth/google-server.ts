import "server-only";
import {createClient} from "@/lib/supabase/server";
import {getSupabaseConfig} from "@/lib/supabase/config";
import {getVerifiedUser} from "./user";
import {googleHandlers} from "./google-http";
import {isVerifiedGoogleSession} from "./google-contract";
import {createServerClient, type CookieOptions} from "@supabase/ssr";
import {cookies} from "next/headers";

async function available() {
  const {url, publishableKey} = getSupabaseConfig();
  const response = await fetch(url + "/auth/v1/settings", {headers: {apikey: publishableKey}, cache: "no-store", signal: AbortSignal.timeout(5000)});
  if (!response.ok) throw Error("provider_settings_unavailable");
  return (await response.json()).external?.google === true;
}
export const googleAuth = googleHandlers({
  available,
  signedIn: async () => !!await getVerifiedUser(),
  begin: async redirectTo => {
    const client = await createClient();
    const {data, error} = await client.auth.signInWithOAuth({provider: "google", options: {redirectTo, skipBrowserRedirect: true, scopes: "openid email profile", queryParams: {prompt: "select_account"}}});
    return error ? null : data.url;
  },
  finish: async (code, agreement) => {
    const store = await cookies();
    const {url, publishableKey} = getSupabaseConfig();
    const pending: {name: string; value: string; options: CookieOptions}[] = [];
    const current = new Map(store.getAll().map(cookie => [cookie.name, cookie.value]));
    const client = createServerClient(url, publishableKey, {cookies: {
      getAll: () => [...current].map(([name, value]) => ({name, value})),
      setAll: changes => {for (const change of changes) {pending.push(change); current.set(change.name, change.value);}},
    }});
    // PKCE is checked by Supabase; do not accept a token supplied by the browser.
    const exchanged = await client.auth.exchangeCodeForSession(code);
    if (exchanged.error) return false;
    try {
      const {data, error} = await client.auth.getUser();
      const claims = await client.auth.getClaims();
      if (error || !data.user || claims.error || !claims.data || !isVerifiedGoogleSession(data.user, claims.data.claims)) throw Error();
      const recorded = await client.auth.updateUser({data: {legal_acceptance: agreement}});
      if (recorded.error) throw Error();
      // Commit authentication cookies only after identity and agreement succeeded.
      for (const cookie of pending) store.set(cookie.name, cookie.value, cookie.options);
      return true;
    } catch {
      await client.auth.signOut({scope: "local"});
      return false;
    }
  },
}, {
  secure: process.env.NODE_ENV === "production", origin: process.env.APP_ORIGIN,
  supabaseOrigin: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://unconfigured.invalid").origin,
  signingSecret: () => {
    // Dedicated MAC context; this value never goes to the browser or Google.
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!secret?.startsWith("sb_secret_") || secret.length < 32) throw Error("oauth_configuration_unavailable");
    return secret;
  },
});
