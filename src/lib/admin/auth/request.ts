import { NextResponse } from "next/server.js";
import { authHeaders, trustedAuthOrigin } from "../../auth/signup-http.ts";

export function adminWriteError(request: Request): NextResponse | undefined {
  const settings = { secure: process.env.NODE_ENV === "production", origin: process.env.APP_ORIGIN };
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    !trustedAuthOrigin(request.headers.get("origin"), settings)
  ) {
    return NextResponse.json({ error: "Origem da solicitação não autorizada." }, {
      status: 403,
      headers: authHeaders,
    });
  }
}
