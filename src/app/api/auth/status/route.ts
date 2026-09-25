import { getVerifiedUser } from "@/lib/auth/user";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const user = await getVerifiedUser();
    return Response.json(
      { authenticated: Boolean(user) },
      { status: user ? 200 : 401, headers },
    );
  } catch {
    return Response.json(
      { error: "auth_unavailable" },
      { status: 503, headers },
    );
  }
}
