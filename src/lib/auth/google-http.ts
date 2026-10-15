import {NextRequest, NextResponse} from "next/server.js";
import {authHeaders, trustedAuthOrigin} from "./signup-http.ts";
import {readAuthJson, AuthBodyError} from "./request-body.ts";
import {googleAgreementPath, googleCallbackPath, googleCookieName, openGoogleAgreement, parseGoogleStart, sealGoogleAgreement, validGoogleAuthorizeUrl} from "./google-contract.ts";
import type {SignupAgreement} from "./legal-documents.ts";

type Settings = {secure: boolean; origin?: string; supabaseOrigin: string; signingSecret: () => string};
type Dependencies = {
  available: () => Promise<boolean>;
  signedIn: () => Promise<boolean>;
  begin: (redirectTo: string) => Promise<string | null>;
  finish: (code: string, agreement: SignupAgreement) => Promise<boolean>;
};
export function googleHandlers(deps: Dependencies, settings: Settings) {
  const json = (body: unknown, status = 200) => NextResponse.json(body, {status, headers: authHeaders});
  const cookieOptions = {httpOnly: true, secure: settings.secure, sameSite: "lax" as const, path: googleAgreementPath};
  async function status(request: NextRequest) {
    if (request.nextUrl.search) return json({enabled: false}, 400);
    try {return json({enabled: await deps.available()});}
    catch {return json({enabled: false}, 503);}
  }
  async function start(request: NextRequest) {
    const origin = trustedAuthOrigin(request.headers.get("origin"), settings);
    if (!origin || request.headers.get("sec-fetch-site") === "cross-site") return json({error: "invalid_origin"}, 403);
    if (request.nextUrl.search) return json({error: "invalid_input"}, 400);
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return json({error: "invalid_input"}, 415);
    try {
      if (!parseGoogleStart(await readAuthJson(request, 512))) return json({error: "agreement_required"}, 400);
      if (await deps.signedIn()) return json({error: "already_authenticated"}, 409);
      if (!await deps.available()) return json({error: "google_unavailable"}, 503);
      const pending = sealGoogleAgreement(origin, settings.signingSecret());
      const url = await deps.begin(origin + googleCallbackPath);
      if (!url || !validGoogleAuthorizeUrl(url, settings.supabaseOrigin, origin)) return json({error: "google_unavailable"}, 503);
      const response = json({url});
      response.cookies.set(googleCookieName(settings.secure), pending, {...cookieOptions, maxAge: 600});
      return response;
    } catch (error) {
      return error instanceof AuthBodyError ? json({error: error.message}, error.status) : json({error: "google_unavailable"}, 503);
    }
  }
  async function callback(request: NextRequest) {
    const localOrigin = request.headers.get("host") ? "http://" + request.headers.get("host") : request.nextUrl.origin;
    const origin = settings.origin ? trustedAuthOrigin(settings.origin, settings) : trustedAuthOrigin(localOrigin, settings);
    if (!origin) return json({error: "auth_unavailable"}, 503);
    let ok = false;
    try {
      const params = request.nextUrl.searchParams;
      const codes = params.getAll("code");
      const agreement = openGoogleAgreement(request.cookies.get(googleCookieName(settings.secure))?.value, origin, settings.signingSecret());
      if (agreement && !params.has("error") && codes.length === 1 && /^[A-Za-z0-9_-]{16,512}$/.test(codes[0]) && [...params.keys()].every(key => key === "code")) {
        ok = await deps.finish(codes[0], agreement);
      }
    } catch { /* Return only a fixed, non-sensitive destination. */ }
    const response = NextResponse.redirect(new URL(ok ? "/cadastro/confirmado" : "/auth/google/erro", origin), {status: 303, headers: authHeaders});
    response.cookies.set(googleCookieName(settings.secure), "", {...cookieOptions, maxAge: 0});
    return response;
  }
  return {status, start, callback};
}
