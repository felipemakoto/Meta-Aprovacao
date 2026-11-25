import { getVerifiedUser } from "@/lib/auth/user";
import { readActiveAdmin } from "@/lib/admin/auth/admin-check";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const user = await getVerifiedUser();
    if (!user?.email_confirmed_at) {
      return Response.json({ isAdmin: false }, { status: 200, headers });
    }
    const isAdmin = Boolean(await readActiveAdmin(user.id));
    return Response.json({ isAdmin }, { status: 200, headers });
  } catch {
    return Response.json({ isAdmin: false }, { status: 200, headers });
  }
}
