import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";
import type { SessionPayload } from "../types";

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

export async function requireApiSession(): Promise<
  { session: SessionPayload; errorResponse?: never } | { session?: never; errorResponse: NextResponse }
> {
  const session = await getServerSession();
  if (!session) {
    return {
      errorResponse: NextResponse.json(
        { error: "Sessão expirada ou não autenticada." },
        { status: 401 }
      ),
    };
  }
  return { session };
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "127.0.0.1";
}
