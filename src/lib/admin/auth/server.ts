import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import { authHeaders } from "@/lib/auth/signup-http";
import { readActiveAdmin } from "./admin-check";
import { adminWriteError } from "./request";
import { revalidateAdminSession, SESSION_COOKIE_NAME, verifySessionToken } from "./session";
import type { SessionPayload } from "../types";

const readCurrentSession = cache(async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifySessionToken(token);
  return revalidateAdminSession(session, readActiveAdmin);
});

export async function getServerSession(): Promise<SessionPayload | null> {
  return readCurrentSession().catch(() => null);
}

export async function requireApiSession(writeRequest?: Request): Promise<
  { session: SessionPayload; errorResponse?: never } | { session?: never; errorResponse: NextResponse }
> {
  if (writeRequest) {
    const errorResponse = adminWriteError(writeRequest);
    if (errorResponse) return { errorResponse };
  }
  try {
    const session = await readCurrentSession();
    if (session) return { session };
  } catch {
    return {
      errorResponse: NextResponse.json(
        { error: "Não foi possível verificar a sessão. Tente novamente." },
        { status: 503, headers: authHeaders }
      ),
    };
  }
  return {
    errorResponse: NextResponse.json(
      { error: "Sessão expirada ou não autenticada." },
      { status: 401, headers: authHeaders }
    ),
  };
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "127.0.0.1";
}
